const nodemailer = require('nodemailer');
const { getEmailConfig, resolveEmailHost } = require('../../../config/email');
const { createLogger, maskSecret } = require('../../../lib/logger');

async function createHostingerTransport(options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:SMTP');
  const transportOptions = {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };

  if (config.smtp.forceIpFamily && config.smtp.ipFamily) {
    try {
      const resolved = await resolveEmailHost(config.smtp.host, config.smtp.ipFamily);
      transportOptions.host = resolved.address;
      transportOptions.name = config.smtp.host;
      transportOptions.tls = {
        servername: config.smtp.host,
      };

      logger.info('Servidor SMTP resolvido com família de IP preferencial', {
        host: config.smtp.host,
        resolvedAddress: resolved.address,
        family: resolved.family,
      });
    } catch (error) {
      logger.warn('Falha ao resolver SMTP com família de IP preferencial; usando host original', {
        host: config.smtp.host,
        family: config.smtp.ipFamily,
        message: error.message,
      });
    }
  }

  logger.debug('Transport SMTP preparado para uso futuro', {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    ipFamily: config.smtp.forceIpFamily ? config.smtp.ipFamily : 'auto',
    user: config.user,
    pass: maskSecret(config.pass),
  });

  return nodemailer.createTransport(transportOptions);
}

module.exports = {
  createHostingerTransport,
};
