// middlewares/errorHandler.js
const logger = require('../config/logger');

// For "next(err)" style errors
function errorHandler(err, req, res, next) {
  logger.error('Unhandled Error:', err);

  // If error is known, handle gracefully. Otherwise fallback
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Server Error';

  // Return JSON
  res.status(statusCode).json({
    error: {
      message,
      // optionally remove stack in production
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    }
  });
}

module.exports = errorHandler;