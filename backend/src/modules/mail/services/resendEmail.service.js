const https = require('https');
const { URL } = require('url');
const { getEmailConfig } = require('../../../config/email');
const { createLogger, maskSecret } = require('../../../lib/logger');

function normalizeAddressList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

function createRequestBody(mailOptions, config) {
  return {
    from: mailOptions.from || `"${config.resend.fromName}" <${config.resend.fromEmail}>`,
    to: normalizeAddressList(mailOptions.to),
    cc: normalizeAddressList(mailOptions.cc),
    bcc: normalizeAddressList(mailOptions.bcc),
    reply_to: normalizeAddressList(mailOptions.replyTo || config.resend.replyToEmail),
    subject: mailOptions.subject || '(sem assunto)',
    text: mailOptions.text || undefined,
    html: mailOptions.html || undefined,
  };
}

function postJson(urlString, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const payload = Buffer.from(JSON.stringify(body));

    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length,
          ...headers,
        },
      },
      response => {
        const chunks = [];

        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let parsed = null;

          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }

          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(parsed || {});
            return;
          }

          const error = new Error(
            (parsed && parsed.message) ||
            (parsed && parsed.error && parsed.error.message) ||
            `Resend retornou status ${response.statusCode}`
          );

          error.statusCode = response.statusCode;
          error.responseBody = parsed;
          reject(error);
        });
      }
    );

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('Timeout ao chamar API do Resend'));
    });
    request.write(payload);
    request.end();
  });
}

async function sendWithResend(mailOptions, options = {}) {
  const config = options.config || getEmailConfig();
  const logger = options.logger || createLogger('MAIL:RESEND');

  if (!config.resend.apiKey) {
    const error = new Error('RESEND_API_KEY não configurada');
    error.code = 'RESEND_CONFIG_INVALID';
    throw error;
  }

  const requestBody = createRequestBody(mailOptions, config);
  const endpoint = `${config.resend.apiBaseUrl.replace(/\/+$/, '')}/emails`;

  logger.info('Tentando envio pela API do Resend', {
    endpoint,
    from: requestBody.from,
    to: requestBody.to,
    replyTo: requestBody.reply_to,
    apiKey: maskSecret(config.resend.apiKey),
  });

  const response = await postJson(
    endpoint,
    {
      Authorization: `Bearer ${config.resend.apiKey}`,
    },
    requestBody
  );

  logger.info('Envio pela API do Resend concluído com sucesso', {
    id: response && response.id ? response.id : undefined,
    to: requestBody.to,
    subject: requestBody.subject,
  });

  return response;
}

module.exports = {
  sendWithResend,
};
