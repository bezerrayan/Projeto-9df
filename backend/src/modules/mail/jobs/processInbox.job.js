const { getEmailConfig, getSafeEmailConfigForLogs } = require('../../../config/email');
const { createLogger } = require('../../../lib/logger');
const { HostingerImapService } = require('../services/hostingerImap.service');
const { MailParserService } = require('../services/mailParser.service');
const { MailRoutingService } = require('../services/mailRouting.service');
const { MailMessageRepository } = require('../repositories/mailMessage.repository');

async function processInboxJob(options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:JOB');
  const repository = options.repository || new MailMessageRepository();
  const imapService = options.imapService || new HostingerImapService({ config, logger: logger.child('IMAP') });
  const parser = options.parser || new MailParserService({ logger: logger.child('PARSER') });
  const router = options.router || new MailRoutingService({ config, logger: logger.child('ROUTER') });

  const folders = config.folders;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  logger.info('Job de processamento da INBOX iniciado', getSafeEmailConfigForLogs());

  try {
    await imapService.connect();
    await imapService.ensureMailboxes([
      folders.financeiro,
      folders.atendimento,
      folders.comercial,
      folders.triagem,
    ]);
    await imapService.openInbox();

    const uids = await imapService.listUnprocessedMessageUids({
      batchSize: options.batchSize,
      unseenOnly: options.unseenOnly,
    });

    logger.info('UIDs selecionados para processamento', { count: uids.length, uids });

    for (const uid of uids) {
      try {
        const imapMessage = await imapService.fetchMessageSourceByUid(uid);
        const mail = await parser.parse(imapMessage);

        if (mail.messageId && repository.isEnabled()) {
          const existing = await repository.findByMessageId(mail.messageId);

          if (existing && existing.status_processamento !== 'error') {
            skipped += 1;
            logger.warn('Mensagem já registrada anteriormente; evitando reprocessamento', {
              uid,
              messageId: mail.messageId,
              storedStatus: existing.status_processamento,
            });

            if (config.processing.markSeenAfterProcessing) {
              await imapService.markAsSeen(uid);
            }

            if (existing.folder_destino && existing.folder_destino !== folders.inbox) {
              await imapService.moveMessageByUid(uid, existing.folder_destino);
            }

            continue;
          }
        }

        const route = router.classify(mail);
        logger.info(`Email UID ${uid} classificado`, {
          uid,
          messageId: mail.messageId,
          destination: route.destination,
          rule: route.rule,
        });

        if (config.processing.markSeenAfterProcessing) {
          await imapService.markAsSeen(uid);
        }

        await imapService.moveMessageByUid(uid, route.destination);

        await repository.saveProcessedEmail({
          messageId: mail.messageId || `uid:${uid}`,
          uid,
          fromEmail: mail.fromEmail,
          fromName: mail.fromName,
          subject: mail.subject,
          textBody: mail.text,
          htmlBody: mail.html,
          receivedAt: mail.date ? new Date(mail.date) : new Date(),
          folderOriginal: folders.inbox,
          folderDestino: route.destination,
          statusProcessamento: 'processed',
          processingError: null,
          attachmentsJson: JSON.stringify(
            mail.attachments.map(item => ({
              filename: item.filename,
              contentType: item.contentType,
              size: item.size,
              contentDisposition: item.contentDisposition,
              contentId: item.contentId,
            }))
          ),
          headersJson: JSON.stringify({
            references: mail.references,
            inReplyTo: mail.inReplyTo,
            headers: mail.headers,
          }),
        });

        processed += 1;
        logger.info(`Email UID ${uid} movido com sucesso`, {
          uid,
          destination: route.destination,
        });
      } catch (error) {
        failed += 1;
        logger.error(`Erro ao processar UID ${uid}`, { uid, message: error.message });

        await repository.saveProcessedEmail({
          messageId: `uid:${uid}`,
          uid,
          fromEmail: null,
          fromName: null,
          subject: null,
          textBody: null,
          htmlBody: null,
          receivedAt: new Date(),
          folderOriginal: folders.inbox,
          folderDestino: null,
          statusProcessamento: 'error',
          processingError: error.message,
          attachmentsJson: JSON.stringify([]),
          headersJson: JSON.stringify({}),
        });
      }
    }

    logger.info('Job de processamento da INBOX finalizado', {
      processed,
      skipped,
      failed,
    });

    return { processed, skipped, failed };
  } catch (error) {
    logger.error('Falha no fluxo geral de processamento da INBOX', { message: error.message });
    throw error;
  } finally {
    await imapService.close();
  }
}

module.exports = {
  processInboxJob,
};
