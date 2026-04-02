const db = require('../config/database');
const config = require('../config/env');
const { processInboxJob } = require('../modules/mail/jobs/processInbox.job');
const { createLogger } = require('../lib/logger');

function canFallbackToFile(error) {
  const message = String(error?.message || '').toLowerCase();

  return (
    config.DB_MODE === 'mysql' &&
    (
      message.includes('enotfound') ||
      message.includes('econnrefused') ||
      message.includes('access denied') ||
      message.includes('connect timed out') ||
      message.includes('etimedout')
    )
  );
}

async function run() {
  const logger = createLogger('MAIL:RUNNER');

  try {
    try {
      await db.init();
    } catch (error) {
      if (!canFallbackToFile(error)) {
        throw error;
      }

      logger.warn('Banco indisponível para o runner local; continuando sem persistência MySQL', {
        dbMode: config.DB_MODE,
        message: error.message,
      });
    }

    const result = await processInboxJob({ logger });
    logger.info('Execução manual concluída', result);
    process.exit(0);
  } catch (error) {
    logger.error('Execução manual falhou', { message: error.message });
    process.exit(1);
  }
}

run();
