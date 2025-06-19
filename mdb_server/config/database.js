const mongoose = require('mongoose');
const winston = require('winston');
const { logDBError } = require('../middleware/log');
require('dotenv').config();

// Configure Winston logger for database connection events
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ],
});

/**
 * Connects to MongoDB using the MONGO_URL from environment variables.
 * @throws {Error} If the connection fails, logs the error and exits the process.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    logger.info('Connected to MongoDB');
  } catch (error) {
    logDBError(error, { func: 'connectDB', MONGO_URL: process.env.MONGO_URL });
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
  logDBError(err, { func: 'onError' });
  logger.error(`MongoDB connection error after initial connection: ${err.message}`);
});

// Handle MongoDB disconnection with reconnection attempt
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000); // Attempt to reconnect after 5 seconds
});

module.exports = connectDB;