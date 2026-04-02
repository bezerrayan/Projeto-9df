const { simpleParser } = require('mailparser');
const { createLogger } = require('../../../lib/logger');

function toAddressList(addressObject) {
  return (addressObject?.value || []).map(entry => ({
    name: entry.name || '',
    email: entry.address || '',
  }));
}

function headersToObject(headers) {
  const relevant = ['message-id', 'references', 'in-reply-to', 'reply-to', 'return-path', 'x-mailer'];
  const mapped = {};

  for (const key of relevant) {
    if (!headers?.has(key)) continue;
    const value = headers.get(key);
    mapped[key] = Array.isArray(value) ? value.join(', ') : String(value || '');
  }

  return mapped;
}

class MailParserService {
  constructor(options = {}) {
    this.logger = options.logger || createLogger('MAIL:PARSER');
  }

  async parse(imapMessage) {
    if (!imapMessage?.source) {
      throw new Error('Mensagem IMAP sem conteúdo RFC822 para parse');
    }

    const parsed = await simpleParser(imapMessage.source);
    const from = toAddressList(parsed.from);
    const to = toAddressList(parsed.to);

    const normalized = {
      uid: imapMessage.uid,
      seq: imapMessage.seq,
      messageId: parsed.messageId || null,
      from,
      to,
      fromName: from[0]?.name || '',
      fromEmail: from[0]?.email || '',
      subject: parsed.subject || '(sem assunto)',
      date: parsed.date || imapMessage.internalDate || new Date(),
      text: parsed.text || '',
      html: parsed.html ? String(parsed.html) : '',
      references: parsed.references || [],
      inReplyTo: parsed.inReplyTo || null,
      attachments: (parsed.attachments || []).map(attachment => ({
        filename: attachment.filename || null,
        contentType: attachment.contentType || 'application/octet-stream',
        size: attachment.size || 0,
        contentDisposition: attachment.contentDisposition || null,
        checksum: attachment.checksum || null,
        contentId: attachment.cid || null,
        related: Boolean(attachment.related),
        content: attachment.content || null,
      })),
      headers: headersToObject(parsed.headers),
      flags: Array.from(imapMessage.flags || []),
      rawHeaders: imapMessage.headers ? imapMessage.headers.toString('utf8') : '',
    };

    this.logger.debug('Mensagem parseada com sucesso', {
      uid: normalized.uid,
      messageId: normalized.messageId,
      attachments: normalized.attachments.length,
    });

    return normalized;
  }
}

module.exports = {
  MailParserService,
};
