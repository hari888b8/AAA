'use strict';

const pino = require('pino');

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  ...(process.env.NODE_ENV !== 'production' && {
    transport: { target: 'pino/file', options: { destination: 1 } },
    formatters: { level: (label) => ({ level: label }) },
  }),
  ...(process.env.NODE_ENV === 'production' && {
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({ pid: bindings.pid, host: bindings.hostname }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.otp', '*.token'],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
