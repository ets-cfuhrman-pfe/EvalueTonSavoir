import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AppError from './AppError';
import { UNAUTHORIZED_NO_TOKEN_GIVEN, UNAUTHORIZED_INVALID_TOKEN } from '../constants/errorCodes';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

class Token {
    create(email: string, userId: string): string {
        return jwt.sign({ email, userId }, process.env.JWT_SECRET as string, { expiresIn: '2h' });
    }

    authenticate(req: Request, res: Response, next: NextFunction): void {
        try {
            const authHeader = req.header('Authorization');
            const token = authHeader && authHeader.split(' ')[1];
            if (!token) {
                throw new AppError(UNAUTHORIZED_NO_TOKEN_GIVEN);
            }

            jwt.verify(token, process.env.JWT_SECRET as string, (error, payload) => {
                if (error) {
                    throw new AppError(UNAUTHORIZED_INVALID_TOKEN);
                }
                req.user = payload;
                next();
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new Token();
