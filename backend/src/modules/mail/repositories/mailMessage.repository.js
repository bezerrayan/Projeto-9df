const db = require('../../../config/database');
const config = require('../../../config/env');

class MailMessageRepository {
  isEnabled() {
    return config.DB_MODE === 'mysql' && !!db.getPool();
  }

  async findByMessageId(messageId) {
    if (!this.isEnabled() || !messageId) return null;

    const [rows] = await db.getPool().query(
      'SELECT * FROM mail_inbox_messages WHERE message_id = ? LIMIT 1',
      [messageId]
    );

    return rows[0] || null;
  }

  async saveProcessedEmail(entry) {
    if (!this.isEnabled()) return;

    const payload = [
      entry.messageId || null,
      entry.uid || null,
      entry.fromEmail || null,
      entry.fromName || null,
      entry.subject || null,
      entry.textBody || null,
      entry.htmlBody || null,
      entry.receivedAt || null,
      entry.folderOriginal || null,
      entry.folderDestino || null,
      entry.statusProcessamento || 'processed',
      entry.processingError || null,
      entry.attachmentsJson || null,
      entry.headersJson || null,
    ];

    await db.getPool().query(
      `INSERT INTO mail_inbox_messages (
        message_id,
        uid,
        from_email,
        from_name,
        subject,
        text_body,
        html_body,
        received_at,
        folder_original,
        folder_destino,
        status_processamento,
        processing_error,
        attachments_json,
        headers_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        uid = VALUES(uid),
        from_email = VALUES(from_email),
        from_name = VALUES(from_name),
        subject = VALUES(subject),
        text_body = VALUES(text_body),
        html_body = VALUES(html_body),
        received_at = VALUES(received_at),
        folder_original = VALUES(folder_original),
        folder_destino = VALUES(folder_destino),
        status_processamento = VALUES(status_processamento),
        processing_error = VALUES(processing_error),
        attachments_json = VALUES(attachments_json),
        headers_json = VALUES(headers_json),
        updated_at = CURRENT_TIMESTAMP`,
      payload
    );
  }
}

module.exports = {
  MailMessageRepository,
};
