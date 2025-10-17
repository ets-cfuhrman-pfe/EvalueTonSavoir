const AppError = require("./AppError");
const logger = require('../config/logger');

const errorHandler = (loggerInstance = logger) => (error, req, res, _next) => {
    res.setHeader('Cache-Control', 'no-store');

    // Add user context to error logging if available
    const userContext = {
      userId: req.user?.userId || null,
      userEmail: req.user?.email || null,
      requestId: req.requestId || null,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl
    };

    if (error instanceof AppError) {
      // Log operational errors as warnings with context
      loggerInstance.warn('Application Error', {
        message: error.message,
        statusCode: error.statusCode,
        isOperational: error.isOperational,
        ...userContext
      });

      return res.status(error.statusCode).json({
        message: error.message,
        code: error.statusCode
      });
    }

    // Log unexpected errors with full stack trace
    loggerInstance.error('Unexpected Server Error', {
      message: error.message,
      stack: error.stack,
      ...userContext
    });

    // Log security event for potential attacks
    if (error.message && (
      error.message.toLowerCase().includes('sql') ||
      error.message.toLowerCase().includes('injection') ||
      error.message.toLowerCase().includes('xss')
    )) {
      loggerInstance.logSecurityEvent('potential_attack_detected', 'error', {
        errorMessage: error.message,
        ...userContext
      });
    }

    return res.status(500).json({
      message: "Une erreur interne s'est produite.",
      code: 500
    });
  };

module.exports = errorHandler;
