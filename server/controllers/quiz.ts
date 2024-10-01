import { Request, Response, NextFunction } from 'express';
import AppError from '../middleware/AppError';
import { MISSING_REQUIRED_PARAMETER, NOT_IMPLEMENTED, QUIZ_NOT_FOUND, FOLDER_NOT_FOUND, QUIZ_ALREADY_EXISTS, GETTING_QUIZ_ERROR, DELETE_QUIZ_ERROR, UPDATE_QUIZ_ERROR, MOVING_QUIZ_ERROR } from '../constants/errorCodes';
import { Quiz } from '../models/quiz';
import { Folder } from '../models/folder';
import Emailer from '../config/email';

class QuizController {
    private quiz: Quiz;
    private folder: Folder;
    private emailer: Emailer;

    constructor() {
        this.folder = new Folder();
        this.quiz = new Quiz();
        this.emailer = new Emailer();
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, content, folderId } = req.body;

            if (!title || !content || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await this.folder.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await this.quiz.create(title, content, folderId, req.user.userId);

            if (!result) {
                throw new AppError(QUIZ_ALREADY_EXISTS);
            }

            return res.status(200).json({
                message: 'Quiz créé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async get(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }


            const content = await this.quiz.getContent(quizId);

            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }

            // Is this quiz mine
            if (content.userId != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            return res.status(200).json({
                data: content
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const owner = await this.quiz.getOwner(quizId);

            if (owner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            const result = await this.quiz.delete(quizId);

            if (!result) {
                throw new AppError(DELETE_QUIZ_ERROR);
            }

            return res.status(200).json({
                message: 'Quiz supprimé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId, newTitle, newContent } = req.body;

            if (!newTitle || !newContent || !quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const owner = await this.quiz.getOwner(quizId);

            if (owner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            const result = await this.quiz.update(quizId, newTitle, newContent);

            if (!result) {
                throw new AppError(UPDATE_QUIZ_ERROR);
            }

            return res.status(200).json({
                message: 'Quiz mis à jours avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async move(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId, newFolderId } = req.body;

            if (!quizId || !newFolderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const quizOwner = await this.quiz.getOwner(quizId);

            if (quizOwner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            // Is this folder mine
            const folderOwner = await this.folder.getOwner(newFolderId);

            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await this.quiz.move(quizId, newFolderId);

            if (!result) {
                throw new AppError(MOVING_QUIZ_ERROR);
            }

            return res.status(200).json({
                message: 'Utilisateur déplacé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }

    }

    async copy(req: Request, res: Response, next: NextFunction) {
        const { quizId, newTitle, folderId } = req.body;

        if (!quizId || !newTitle || !folderId) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }

        throw new AppError(NOT_IMPLEMENTED);
    }

    async deleteQuizzesByFolderId(req: Request, res: Response, next: NextFunction) {
        try {
            const { folderId } = req.body;

            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Call the method from the Quiz model to delete quizzes by folder ID
            await this.quiz.deleteQuizzesByFolderId(folderId);

            return res.status(200).json({
                message: 'Quizzes deleted successfully.'
            });
        } catch (error) {
            return next(error);
        }
    }

    async duplicate(req: Request, res: Response, next: NextFunction) {
        const { quizId } = req.body;

        try {
            const newQuizId = await this.quiz.duplicate(quizId, req.user.userId);
            res.status(200).json({ success: true, newQuizId });
        } catch (error) {
            return next(error);
        }
    }

    async quizExists(title: string, userId: string) {
        try {
            const existingFile = await this.quiz.quizExists(title, userId);
            return existingFile !== null;
        } catch (error) {
            throw new AppError(GETTING_QUIZ_ERROR);
        }
    }

    async Share(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId, email } = req.body;

            if (!quizId || !email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const link = `${process.env.FRONTEND_URL}/teacher/Share/${quizId}`;

            this.emailer.quizShare(email, link);

            return res.status(200).json({
                message: 'Quiz  partagé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async getShare(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const content = await this.quiz.getContent(quizId);

            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }

            return res.status(200).json({
                data: content.title
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async receiveShare(req: Request, res: Response, next: NextFunction) {
        try {
            const { quizId, folderId } = req.body;

            if (!quizId || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const folderOwner = await this.folder.getOwner(folderId);
            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const content = await this.quiz.getContent(quizId);
            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }

            const result = await this.quiz.create(content.title, content.content, folderId, req.user.userId);
            if (!result) {
                throw new AppError(QUIZ_ALREADY_EXISTS);
            }

            return res.status(200).json({
                message: 'Quiz partagé reçu.'
            });
        }
        catch (error) {
            return next(error);
        }
    }
}

export default new QuizController();
