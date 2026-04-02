const nodemailer = require('nodemailer');
const { getEmailConfig } = require('../../../config/email');
const { createLogger, maskSecret } = require('../../../lib/logger');

function createHostingerTransport(options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:SMTP');

  logger.debug('Transport SMTP preparado para uso futuro', {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    user: config.user,
    pass: maskSecret(config.pass),
  });

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

module.exports = {
  createHostingerTransport,
};
