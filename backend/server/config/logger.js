// config/logger.js
const { createLogger, format, transports } = require('winston');
const { nodeEnv } = require('./config');

// For production, log in JSON; for development, pretty-print
const logger = createLogger({
  level: nodeEnv === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp(),
    nodeEnv === 'production'
      ? format.json()
      : format.prettyPrint()
  ),
  transports: [
    new transports.Console()
  ]
});

module.exports = logger;