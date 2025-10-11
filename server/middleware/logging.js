const logger = require('../config/logger');

/**
 * Middleware to attach user context to all log entries
 * This should be placed after authentication middleware to capture user info
 */
const attachUserContext = (req, res, next) => {
  // Create a child logger with user context if user is authenticated
  if (req.user) {
    req.logger = logger.child({
      userId: req.user.userId,
      userEmail: req.user.email,
      requestId: req.requestId
    });
    
    // Also attach to response locals for use in other middleware
    res.locals.userContext = {
      userId: req.user.userId,
      userEmail: req.user.email,
      requestId: req.requestId
    };
  } else {
    // For unauthenticated requests, still provide logger with request context
    req.logger = logger.child({
      requestId: req.requestId
    });
  }

  next();
};

/**
 * Middleware to log user actions with standardized format
 * Usage: req.logAction('login', { method: 'email' })
 */
const logUserAction = (req, res, next) => {
  req.logAction = (action, details = {}) => {
    if (req.user) {
      logger.logUserAction(
        req.user.userId,
        req.user.email,
        action,
        {
          requestId: req.requestId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          ...details
        }
      );
    } else {
      logger.warn('Action attempted without authentication', {
        action,
        requestId: req.requestId,
        ip: req.ip,
        ...details
      });
    }
  };

  next();
};

/**
 * Middleware to log security-related events
 * Usage: req.logSecurity('failed_login_attempt', 'warn', { email: 'test@example.com' })
 */
const logSecurityEvent = (req, res, next) => {
  req.logSecurity = (event, level = 'warn', details = {}) => {
    logger.logSecurityEvent(event, level, {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || null,
      userEmail: req.user?.email || null,
      ...details
    });
  };

  next();
};

/**
 * Middleware to log API endpoint access patterns
 * Useful for monitoring and analytics
 */
const logApiAccess = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    
    // Log API access with user context
    logger.logApiRequest(
      req.method,
      req.originalUrl,
      res.statusCode,
      responseTime,
      req.user?.userId || null,
      req.user?.email || null
    );

    // Call original end method
    originalEnd.apply(res, args);
  };

  next();
};

/**
 * Middleware to add database operation logging helper
 * Usage: req.logDbOperation('insert', 'users', 150, true, { recordId: 'abc123' })
 */
const logDatabaseOperation = (req, res, next) => {
  req.logDbOperation = (operation, collection, duration, success = true, details = {}) => {
    logger.logDatabaseOperation(operation, collection, duration, success, {
      userId: req.user?.userId || null,
      requestId: req.requestId,
      ...details
    });
  };

  next();
};

/**
 * Comprehensive logging middleware that combines all logging capabilities
 */
const comprehensiveLogging = [
  attachUserContext,
  logUserAction,
  logSecurityEvent,
  logApiAccess,
  logDatabaseOperation
];

module.exports = {
  attachUserContext,
  logUserAction,
  logSecurityEvent,
  logApiAccess,
  logDatabaseOperation,
  comprehensiveLogging
};