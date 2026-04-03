const { getEmailConfig } = require('../../../config/email');
const { createLogger } = require('../../../lib/logger');
const { sendWithHostingerTransport } = require('./hostingerSmtp.service');
const { sendWithResend } = require('./resendEmail.service');

function resolveProvider(config) {
  const explicit = String(config.outbound.provider || 'auto').trim().toLowerCase();

  if (explicit && explicit !== 'auto') return explicit;
  if (config.resend.apiKey) return 'resend';
  return 'hostinger';
}

async function sendOutboundMail(mailOptions, options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:OUTBOUND');
  const provider = resolveProvider(config);

  logger.info('Provedor de envio selecionado', {
    provider,
    to: mailOptions.to,
    subject: mailOptions.subject,
  });

  if (provider === 'resend') {
    return sendWithResend(mailOptions, {
      config,
      logger: logger.child('RESEND'),
    });
  }

  return sendWithHostingerTransport(mailOptions, {
    config,
    logger: logger.child('SMTP'),
  });
}

module.exports = {
  sendOutboundMail,
  resolveProvider,
};
