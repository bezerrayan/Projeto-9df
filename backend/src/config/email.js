require('./env');

const { maskSecret } = require('../lib/logger');

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getEmailConfig() {
  const config = {
    user: process.env.HOSTINGER_EMAIL_USER || '',
    pass: process.env.HOSTINGER_EMAIL_PASS || '',
    imap: {
      host: process.env.HOSTINGER_IMAP_HOST || 'imap.hostinger.com',
      port: toNumber(process.env.HOSTINGER_IMAP_PORT, 993),
      secure: toBoolean(process.env.HOSTINGER_IMAP_SECURE, true),
      authTimeoutMs: toNumber(process.env.HOSTINGER_IMAP_AUTH_TIMEOUT_MS, 15000),
      socketTimeoutMs: toNumber(process.env.HOSTINGER_IMAP_SOCKET_TIMEOUT_MS, 30000),
    },
    smtp: {
      host: process.env.HOSTINGER_SMTP_HOST || 'smtp.hostinger.com',
      port: toNumber(process.env.HOSTINGER_SMTP_PORT, 465),
      secure: toBoolean(process.env.HOSTINGER_SMTP_SECURE, true),
    },
    folders: {
      inbox: 'INBOX',
      financeiro: 'Financeiro',
      atendimento: 'Atendimento',
      comercial: 'Comercial',
      triagem: 'Triagem',
    },
    processing: {
      batchSize: toNumber(process.env.HOSTINGER_IMAP_BATCH_SIZE, 20),
      unseenOnly: toBoolean(process.env.HOSTINGER_IMAP_UNSEEN_ONLY, true),
      markSeenAfterProcessing: toBoolean(process.env.HOSTINGER_IMAP_MARK_SEEN_AFTER_PROCESSING, true),
      defaultDestination: process.env.HOSTINGER_IMAP_DEFAULT_DESTINATION || 'Triagem',
    },
  };

  const missing = [];

  if (!config.user) missing.push('HOSTINGER_EMAIL_USER');
  if (!config.pass) missing.push('HOSTINGER_EMAIL_PASS');
  if (!config.imap.host) missing.push('HOSTINGER_IMAP_HOST');
  if (!config.smtp.host) missing.push('HOSTINGER_SMTP_HOST');

  if (missing.length) {
    const error = new Error(`Configuração de email incompleta. Defina: ${missing.join(', ')}`);
    error.code = 'EMAIL_CONFIG_INVALID';
    throw error;
  }

  return config;
}

function getSafeEmailConfigForLogs() {
  const cfg = getEmailConfig();

  return {
    user: cfg.user,
    pass: maskSecret(cfg.pass),
    imap: cfg.imap,
    smtp: cfg.smtp,
    folders: cfg.folders,
    processing: cfg.processing,
  };
}

module.exports = {
  getEmailConfig,
  getSafeEmailConfigForLogs,
};
