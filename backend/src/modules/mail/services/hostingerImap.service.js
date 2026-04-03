const { ImapFlow } = require('imapflow');
const { getEmailConfig } = require('../../../config/email');
const { createLogger, maskSecret } = require('../../../lib/logger');

class HostingerImapService {
  constructor(options = {}) {
    this.config = options.config || getEmailConfig();
    this.logger = options.logger || createLogger('MAIL:IMAP');
    this.client = null;
    this.connected = false;
  }

  async connect() {
    if (this.connected && this.client) return this.client;

    const { user, pass, imap } = this.config;
    this.logger.info('Conexão IMAP iniciada', {
      host: imap.host,
      port: imap.port,
      secure: imap.secure,
      user,
      pass: maskSecret(pass),
    });

    this.client = new ImapFlow({
      host: imap.host,
      port: imap.port,
      secure: imap.secure,
      auth: { user, pass },
      authTimeout: imap.authTimeoutMs,
      socketTimeout: imap.socketTimeoutMs,
      logger: false,
    });

    this.client.on('error', error => {
      this.logger.error('Erro na conexão IMAP', { message: error.message });
    });

    await this.client.connect();
    this.connected = true;
    this.logger.info('Conexão IMAP autenticada com sucesso');
    return this.client;
  }

  async close() {
    if (!this.client) return;

    try {
      await this.client.logout();
      this.logger.info('Conexão IMAP encerrada');
    } catch (error) {
      this.logger.warn('Falha ao encerrar conexão IMAP de forma limpa', { message: error.message });
    } finally {
      this.connected = false;
      this.client = null;
    }
  }

  async ensureMailboxes(paths) {
    await this.connect();

    const existingList = await this.client.list();
    const existing = new Set(existingList.map(mailbox => mailbox.path));

    for (const path of paths) {
      if (existing.has(path)) continue;

      try {
        await this.client.mailboxCreate(path);
        this.logger.info('Pasta IMAP criada', { path });
        existing.add(path);
      } catch (error) {
        if (String(error.message || '').toLowerCase().includes('exists')) {
          this.logger.debug('Pasta IMAP já existia', { path });
          continue;
        }

        this.logger.error('Erro ao criar pasta IMAP', { path, message: error.message });
        throw error;
      }
    }
  }

  async openInbox() {
    const mailbox = await this.openMailbox(this.config.folders.inbox);
    this.logger.info('INBOX aberta', { path: mailbox.path, exists: mailbox.exists });
    return mailbox;
  }

  async openMailbox(path) {
    await this.connect();
    return this.client.mailboxOpen(path);
  }

  async listUnprocessedMessageUids(options = {}) {
    await this.openInbox();

    const unseenOnly = options.unseenOnly ?? this.config.processing.unseenOnly;
    const batchSize = options.batchSize ?? this.config.processing.batchSize;
    const query = unseenOnly ? { seen: false } : { all: true };

    const result = await this.client.search(query, { uid: true });
    const uids = Array.isArray(result) ? result.slice(-batchSize) : [];

    this.logger.info('Mensagens encontradas na INBOX', {
      count: uids.length,
      unseenOnly,
      batchSize,
    });

    return uids;
  }

  async fetchMessageSourceByUid(uid) {
    await this.openInbox();

    const message = await this.client.fetchOne(String(uid), {
      uid: true,
      source: true,
      envelope: true,
      internalDate: true,
      flags: true,
      headers: true,
    }, { uid: true });

    if (!message) {
      throw new Error(`Mensagem UID ${uid} não encontrada na INBOX`);
    }

    return message;
  }

  async markAsSeen(uid) {
    await this.openInbox();
    await this.client.messageFlagsAdd(String(uid), ['\\Seen'], { uid: true });
    this.logger.info('Mensagem marcada como lida', { uid });
  }

  async moveMessageByUid(uid, destination) {
    await this.openInbox();
    await this.client.messageMove(String(uid), destination, { uid: true });
    this.logger.info('Mensagem movida com sucesso', { uid, destination });
  }

  async appendMessage(path, content, flags = ['\\Seen']) {
    await this.connect();
    await this.client.append(path, content, flags, new Date());
    this.logger.info('Mensagem adicionada à caixa IMAP', { path });
  }
}

module.exports = {
  HostingerImapService,
};
