const jwt = require('jsonwebtoken')
const AppError = require('./AppError.js');
const { UNAUTHORIZED_NO_TOKEN_GIVEN, UNAUTHORIZED_INVALID_TOKEN } = require('../constants/errorCodes');
const logger = require('../config/logger');
const envConfig = require('../config/environment');

class Token {

    create(email, userId, roles) {
        const token = jwt.sign({ email, userId, roles }, envConfig.get('JWT_SECRET'));
        
        logger.debug('JWT token created', {
            userId: userId,
            userEmail: email,
            roles: roles,
            module: 'jwt-token'
        });
        
        return token;
    }

    authenticate(req, res, next) {
        try {
            const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
            const clientIP = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            const requestId = req.requestId;
            
            if (!token) {
                logger.logSecurityEvent('authentication_no_token', 'warn', {
                    url: req.originalUrl,
                    method: req.method,
                    clientIP: clientIP,
                    userAgent: userAgent,
                    requestId: requestId
                });
                return next(new AppError(UNAUTHORIZED_NO_TOKEN_GIVEN));
            }

            jwt.verify(token, envConfig.get('JWT_SECRET'), (error, payload) => {
                if (error) {
                    logger.logSecurityEvent('authentication_invalid_token', 'warn', {
                        url: req.originalUrl,
                        method: req.method,
                        clientIP: clientIP,
                        userAgent: userAgent,
                        requestId: requestId,
                        tokenError: error.message
                    });
                    return next(new AppError(UNAUTHORIZED_INVALID_TOKEN));
                }

                req.user = payload;
                
                logger.debug('JWT authentication successful', {
                    userId: payload.userId,
                    userEmail: payload.email,
                    roles: payload.roles,
                    url: req.originalUrl,
                    method: req.method,
                    clientIP: clientIP,
                    requestId: requestId,
                    module: 'jwt-token'
                });
                
                return next();
            });

        } catch (error) {
            logger.error('JWT authentication error', {
                url: req.originalUrl,
                method: req.method,
                error: error.message,
                stack: error.stack,
                clientIP: req.ip,
                userAgent: req.get('User-Agent'),
                requestId: req.requestId,
                module: 'jwt-token'
            });
            return next(error);
        }
    }
}

module.exports = new Token();