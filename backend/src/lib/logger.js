function serializeMeta(meta) {
  if (!meta) return '';

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return ' {"meta":"unserializable"}';
  }
}

function createLogger(scope = 'APP') {
  function log(level, message, meta) {
    const ts = new Date().toISOString();
    const line = `[${ts}] [${level}] [${scope}] ${message}${serializeMeta(meta)}`;

    if (level === 'ERROR') {
      console.error(line);
      return;
    }

    if (level === 'WARN') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  return {
    debug(message, meta) {
      log('DEBUG', message, meta);
    },
    info(message, meta) {
      log('INFO', message, meta);
    },
    warn(message, meta) {
      log('WARN', message, meta);
    },
    error(message, meta) {
      log('ERROR', message, meta);
    },
    child(childScope) {
      return createLogger(`${scope}:${childScope}`);
    },
  };
}

function maskSecret(value) {
  const raw = String(value || '');

  if (!raw) return '';
  if (raw.length <= 4) return '*'.repeat(raw.length);

  return `${raw.slice(0, 2)}***${raw.slice(-2)}`;
}

module.exports = {
  createLogger,
  maskSecret,
};
