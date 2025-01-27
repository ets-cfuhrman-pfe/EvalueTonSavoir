const jwt = require('jsonwebtoken')
const dotenv = require('dotenv')
const AppError = require('./AppError.js');
const { UNAUTHORIZED_NO_TOKEN_GIVEN, UNAUTHORIZED_INVALID_TOKEN } = require('../constants/errorCodes');

dotenv.config();

class Token {

    create(email, userId, roles) {
        return jwt.sign({ email, userId, roles }, process.env.JWT_SECRET);
    }

    authenticate(req, res, next) {
        try {
            const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
            if (!token) {
                throw new AppError(UNAUTHORIZED_NO_TOKEN_GIVEN);
            }

            jwt.verify(token, process.env.JWT_SECRET, (error, payload) => {
                if (error) {
                    throw new AppError(UNAUTHORIZED_INVALID_TOKEN)
                }
                
                req.user = payload;
            });

        } catch (error) {
            return next(error);
        }

        return next();
    }
}

module.exports = new Token();