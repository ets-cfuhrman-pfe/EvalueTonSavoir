const morgan = require('morgan');
const logger = require('./logger');

// Custom token for user information
morgan.token('user-info', (req) => {
  const user = req.user;
  if (user) {
    return `userId:${user.userId}|email:${user.email}`;
  }
  return 'anonymous';
});

// Custom token for request ID (if you implement it)
morgan.token('request-id', (req) => {
  return req.requestId || '-';
});

// Custom token for response time in a more readable format
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '-';
  }
  // Calculate diff in milliseconds
  const diff = (res._startAt[0] - req._startAt[0]) * 1e3 +
               (res._startAt[1] - req._startAt[1]) / 1e6;
  return `${diff.toFixed(3)}ms`;
});

// Development format - more detailed and colored
const developmentFormat = ':method :url :status :response-time-ms - :user-info - :request-id';

// Production format - structured for log aggregation
const productionFormat = JSON.stringify({
  method: ':method',
  url: ':url',
  status: ':status',
  responseTime: ':response-time-ms',
  userInfo: ':user-info',
  requestId: ':request-id',
  userAgent: ':user-agent',
  ip: ':remote-addr',
  timestamp: ':date[iso]'
});

// Custom stream that writes to Winston instead of stdout
const stream = {
  write: (message) => {
    // Parse the log message if it's JSON (production format)
    try {
      const logData = JSON.parse(message.trim());
      logger.info('HTTP Request', {
        method: logData.method,
        url: logData.url,
        status: parseInt(logData.status),
        responseTime: logData.responseTime,
        userInfo: logData.userInfo !== 'anonymous' ? logData.userInfo : null,
        requestId: logData.requestId !== '-' ? logData.requestId : null,
        userAgent: logData.userAgent,
        ip: logData.ip,
        type: 'http-request'
      });
    } catch (_error) {
      // Fallback for development format or malformed JSON
      logger.info(message.trim(), { type: 'http-request' });
    }
  }
};

// Create Morgan middleware based on environment
const createMorganMiddleware = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return morgan(
    isDevelopment ? developmentFormat : productionFormat,
    {
      stream,
      skip: (req, _res) => {
        // Skip logging for health checks and static files in production
        if (process.env.NODE_ENV === 'production') {
          return req.url === '/health' || 
                 req.url === '/ping' || 
                 req.url.startsWith('/static/');
        }
        return false;
      }
    }
  );
};

// Middleware to add request ID for tracing
const requestIdMiddleware = (req, res, next) => {
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Enhanced error logging for Morgan
const morganErrorHandler = (err, req, res, next) => {
  logger.error('Morgan logging error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId: req.requestId
  });
  next(err);
};

module.exports = {
  middleware: createMorganMiddleware(),
  requestIdMiddleware,
  errorHandler: morganErrorHandler
};