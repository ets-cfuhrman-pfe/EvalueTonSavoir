const winston = require('winston');
const path = require('path');

// Custom format that includes user context if available
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, userId, userEmail, requestId, ...meta } = info;
    
    let logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message
    };

    // Add user context if available
    if (userId) logEntry.userId = userId;
    if (userEmail) logEntry.userEmail = userEmail;
    if (requestId) logEntry.requestId = requestId;

    // Add stack trace for errors
    if (stack) logEntry.stack = stack;

    // Add any additional metadata
    if (Object.keys(meta).length > 0) {
      logEntry.meta = meta;
    }

    return JSON.stringify(logEntry);
  })
);

// Console format for readable output
const consoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, userId, userEmail, requestId, ...meta } = info;
    
    // Create custom timestamp with timezone abbreviation
    const date = new Date(timestamp);
    const timeStr = date.toLocaleString('en-CA', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short'
    }).replace(/,/g, '');
    
    let logMessage = `[${timeStr}] ${level}:\t${message}`;
    
    // Add user context if available
    if (userId || userEmail || requestId) {
      const context = [];
      if (userId) context.push(`userId: ${userId}`);
      if (userEmail) context.push(`email: ${userEmail}`);
      if (requestId) context.push(`reqId: ${requestId}`);
      logMessage += ` (${context.join(', ')})`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    return logMessage;
  })
);

// Create different transports based on environment
const createTransports = () => {
  const transports = [];
  
  // Console transport (always active)
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );

  // File transports for production
  if (process.env.NODE_ENV === 'production') {
    // Ensure logs directory exists
    const fs = require('fs');
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    // General log file
    transports.push(
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/app.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: customFormat
      })
    );

    // Error-only log file
    transports.push(
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: customFormat
      })
    );
  }

  return transports;
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: customFormat,
  transports: createTransports(),
  // Don't exit on handled exceptions
  exitOnError: false,
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/rejections.log') })
  ]
});

// Create a child logger with user context
logger.child = (context = {}) => {
  return {
    debug: (message, meta = {}) => logger.debug(message, { ...context, ...meta }),
    info: (message, meta = {}) => logger.info(message, { ...context, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { ...context, ...meta }),
    error: (message, meta = {}) => logger.error(message, { ...context, ...meta })
  };
};

// Helper functions for common logging patterns
logger.logUserAction = (userId, userEmail, action, details = {}) => {
  logger.info(`User action: ${action}`, {
    userId,
    userEmail,
    action,
    ...details
  });
};

logger.logApiRequest = (method, url, statusCode, responseTime, userId = null, userEmail = null) => {
  logger.info(`API Request: ${method} ${url}`, {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId,
    userEmail
  });
};

logger.logSocketEvent = (event, socketId, userId = null, details = {}) => {
  logger.info(`Socket event: ${event}`, {
    event,
    socketId,
    userId,
    ...details
  });
};

logger.logDatabaseOperation = (operation, collection, duration, success = true, details = {}) => {
  const level = success ? 'info' : 'error';
  logger[level](`Database ${operation}: ${collection}`, {
    operation,
    collection,
    duration: `${duration}ms`,
    success,
    ...details
  });
};

// Security logging
logger.logSecurityEvent = (event, level = 'warn', details = {}) => {
  logger[level](`Security event: ${event}`, {
    securityEvent: true,
    event,
    ...details
  });
};

module.exports = logger;
