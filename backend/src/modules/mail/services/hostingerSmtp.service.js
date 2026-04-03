const nodemailer = require('nodemailer');
const { getEmailConfig, resolveEmailHost } = require('../../../config/email');
const { createLogger, maskSecret } = require('../../../lib/logger');

async function buildTransportOptions(config, logger, smtpConfig) {
  const transportOptions = {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
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
      const resolved = await resolveEmailHost(smtpConfig.host, config.smtp.ipFamily);
      transportOptions.host = resolved.address;
      transportOptions.name = smtpConfig.host;
      transportOptions.tls = {
        servername: smtpConfig.host,
      };

      logger.info('Servidor SMTP resolvido com família de IP preferencial', {
        host: smtpConfig.host,
        resolvedAddress: resolved.address,
        family: resolved.family,
        port: smtpConfig.port,
      });
    } catch (error) {
      logger.warn('Falha ao resolver SMTP com família de IP preferencial; usando host original', {
        host: smtpConfig.host,
        family: config.smtp.ipFamily,
        message: error.message,
        port: smtpConfig.port,
      });
    }
  }

  if (smtpConfig.requireTLS) {
    transportOptions.requireTLS = true;
  }

  logger.debug('Transport SMTP preparado para uso futuro', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    requireTLS: Boolean(smtpConfig.requireTLS),
    ipFamily: config.smtp.forceIpFamily ? config.smtp.ipFamily : 'auto',
    user: config.user,
    pass: maskSecret(config.pass),
  });

  return transportOptions;
}

function getTransportCandidates(config) {
  const candidates = [
    {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      requireTLS: false,
      label: 'primary',
    },
  ];

  if (config.smtp.fallbackEnabled) {
    const fallback = {
      host: config.smtp.host,
      port: config.smtp.fallbackPort,
      secure: config.smtp.fallbackSecure,
      requireTLS: config.smtp.fallbackRequireTls,
      label: 'fallback',
    };

    const alreadyIncluded = candidates.some(candidate =>
      candidate.host === fallback.host &&
      candidate.port === fallback.port &&
      candidate.secure === fallback.secure &&
      Boolean(candidate.requireTLS) === Boolean(fallback.requireTLS)
    );

    if (!alreadyIncluded) {
      candidates.push(fallback);
    }
  }

  return candidates;
}

async function createHostingerTransport(options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:SMTP');
  const transportOptions = await buildTransportOptions(config, logger, {
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    requireTLS: false,
  });

  return nodemailer.createTransport(transportOptions);
}

async function sendWithHostingerTransport(mailOptions, options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:SMTP');
  const candidates = getTransportCandidates(config);
  let lastError;

  for (const candidate of candidates) {
    const transportOptions = await buildTransportOptions(config, logger, candidate);
    const transport = nodemailer.createTransport(transportOptions);

    try {
      logger.info('Tentando envio SMTP', {
        strategy: candidate.label,
        host: candidate.host,
        port: candidate.port,
        secure: candidate.secure,
        requireTLS: Boolean(candidate.requireTLS),
      });

      const info = await transport.sendMail(mailOptions);

      logger.info('Envio SMTP concluído com sucesso', {
        strategy: candidate.label,
        host: candidate.host,
        port: candidate.port,
        messageId: info && info.messageId ? info.messageId : undefined,
      });

      return info;
    } catch (error) {
      lastError = error;
      logger.warn('Tentativa SMTP falhou', {
        strategy: candidate.label,
        host: candidate.host,
        port: candidate.port,
        secure: candidate.secure,
        requireTLS: Boolean(candidate.requireTLS),
        message: error.message,
      });
    } finally {
      transport.close();
    }
  }

  throw lastError || new Error('Falha desconhecida ao enviar email SMTP');
}

module.exports = {
  createHostingerTransport,
  sendWithHostingerTransport,
};
