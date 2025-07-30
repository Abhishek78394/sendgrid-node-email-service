const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details })
    });
  }

  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
};

module.exports = errorHandler;