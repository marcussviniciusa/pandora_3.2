const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'pandora-backend' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: consoleFormat
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(process.env.LOG_PATH || './logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    // Write all errors to error.log
    new winston.transports.File({
      filename: path.join(process.env.LOG_PATH || './logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ]
});

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;
