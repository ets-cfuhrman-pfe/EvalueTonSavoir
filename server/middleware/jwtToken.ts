import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import AppError from './AppError.ts';
import { UNAUTHORIZED_NO_TOKEN_GIVEN, UNAUTHORIZED_INVALID_TOKEN } from '../constants/errorCodes';

dotenv.config();

class Token {

    create(email, userId) {
        return jwt.sign({ email, userId }, process.env.JWT_SECRET);
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

export default new Token()