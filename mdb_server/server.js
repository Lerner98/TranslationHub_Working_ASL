const express = require('express');
const cors = require('cors');
const winston = require('winston');
const connectDB = require('./config/database');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { logRequests } = require('./middleware/log');
require('dotenv').config();

// Configure Winston logger for server events
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
    new winston.transports.File({ filename: 'logs/server.log' })
  ],
});

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequests); // Add HTTP request logging

// Routes
app.use('/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`MDB Server running on port ${PORT}`);
});

// Error handling for server startup
app.on('error', (error) => {
  logger.error(`Server startup error: ${error.message}`);
  process.exit(1);
});