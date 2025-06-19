const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Configure Winston logger for HTTP requests
const httpLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message }) => {
      return `${timestamp} ${message}`;
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'access_%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '14d', // Keep logs for 14 days
    }),
  ],
});

// Configure Winston logger for database operations
const dbLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join('logs', 'access_DB_%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: false,
      maxFiles: '14d', // Keep logs for 14 days
    }),
    new winston.transports.Console(),
  ],
});

/**
 * Middleware to log HTTP requests.
 */
const logRequests = (req, res, next) => {
  const clientIP = req.ip || req.connection?.remoteAddress || 'unknown';
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = `${req.hostname}${req.url}`;
  const statusCode = res.statusCode;

  const logMessage = `${clientIP} - ${timestamp} - ${method} - ${url} - ${statusCode}`;
  httpLogger.info(logMessage);

  next();
};

/**
 * Logs database operation errors.
 * @param {Error} error - The error object.
 * @param {Object} data - Data related to the operation (e.g., function name, query details).
 */
const logDBError = (error, data) => {
  const { func, ...rest } = data;
  const logMessage = `${func} - ${error.message} - data: ${JSON.stringify(rest)}`;
  dbLogger.error(logMessage);
};

module.exports = { logRequests, logDBError };