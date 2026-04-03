const { createHostingerTransport } = require('../modules/mail/services/hostingerSmtp.service');
const { HostingerImapService } = require('../modules/mail/services/hostingerImap.service');
const { createLogger } = require('../lib/logger');
const { getEmailConfig } = require('../config/email');
const MailComposer = require('nodemailer/lib/mail-composer');

const logger = createLogger('MAIL:CONTACT');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMessageAsHtml(message) {
  return escapeHtml(message).replace(/\n/g, '<br>');
}

async function buildRawMessage(message) {
  const composer = new MailComposer(message);
  return composer.compile().build();
}

async function appendCopyToMailbox(path, mailOptions) {
  const config = getEmailConfig();
  const imapService = new HostingerImapService({ config, logger: logger.child('IMAP') });

  try {
    const raw = await buildRawMessage(mailOptions);
    await imapService.appendMessage(path, raw);
  } finally {
    await imapService.close();
  }
}

async function tryAppendCopyToMailbox(path, mailOptions, context) {
  try {
    await appendCopyToMailbox(path, mailOptions);
    logger.info('Cópia sincronizada via IMAP com sucesso', { path, context });
    return true;
  } catch (error) {
    logger.warn('Falha ao sincronizar cópia via IMAP', {
      path,
      context,
      message: error.message,
    });
    return false;
  }
}

async function sendContactNotification(message) {
  const config = getEmailConfig();
  const transport = await createHostingerTransport({ config, logger: logger.child('SMTP') });

  const subject = `[Site] ${message.subject || 'Contato pelo site'}`;
  const mailOptions = {
    from: `"GEAR 9º DF - Site" <${config.user}>`,
    to: config.user,
    replyTo: message.email,
    subject,
    text:
      `Nova mensagem enviada pelo site.\n\n` +
      `Nome: ${message.name}\n` +
      `E-mail: ${message.email}\n` +
      `Assunto: ${message.subject}\n\n` +
      `${message.message}`,
    html:
      `<h2>Nova mensagem enviada pelo site</h2>` +
      `<p><strong>Nome:</strong> ${escapeHtml(message.name)}</p>` +
      `<p><strong>E-mail:</strong> ${escapeHtml(message.email)}</p>` +
      `<p><strong>Assunto:</strong> ${escapeHtml(message.subject)}</p>` +
      `<hr>` +
      `<p>${formatMessageAsHtml(message.message)}</p>`,
  };

  await transport.sendMail(mailOptions);
  logger.info('SMTP do formulário enviado com sucesso', {
    to: config.user,
    replyTo: message.email,
    subject,
  });
  await tryAppendCopyToMailbox(config.folders.inbox, mailOptions, 'contact_notification');

  logger.info('Mensagem do formulário encaminhada para a caixa principal', {
    to: config.user,
    replyTo: message.email,
    subject,
  });
}

async function sendAdminReply(message, reply) {
  const config = getEmailConfig();
  const transport = await createHostingerTransport({ config, logger: logger.child('SMTP') });
  const subject = reply.subject || `Re: ${message.subject || 'Contato pelo site'}`;
  const mailOptions = {
    from: `"GEAR 9º DF" <${config.user}>`,
    to: message.email,
    replyTo: config.user,
    subject,
    text: reply.body,
    html: `<p>${formatMessageAsHtml(reply.body)}</p>`,
  };

  await transport.sendMail(mailOptions);
  logger.info('SMTP de resposta do admin enviado com sucesso', {
    to: message.email,
    subject,
    adminEmail: reply.adminEmail,
  });

  const sentCandidates = Array.from(new Set([config.folders.sent].concat(config.folders.sentFallbacks || [])));
  let appendedToSent = false;

  for (const candidate of sentCandidates) {
    appendedToSent = await tryAppendCopyToMailbox(candidate, mailOptions, 'admin_reply');
    if (appendedToSent) break;
  }

  if (!appendedToSent) {
    logger.warn('Não foi possível registrar cópia da resposta em nenhuma pasta de enviados', {
      tried: sentCandidates,
      subject,
      to: message.email,
    });
  }

  logger.info('Resposta enviada pelo painel administrativo', {
    messageId: message.id,
    to: message.email,
    subject,
    adminEmail: reply.adminEmail,
  });
}

module.exports = {
  sendContactNotification,
  sendAdminReply,
};
