const model = require('../models/quiz.js');
const folderModel = require('../models/folders.js');
const emailer = require('../config/email.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, NOT_IMPLEMENTED, QUIZ_NOT_FOUND, FOLDER_NOT_FOUND, QUIZ_ALREADY_EXISTS, GETTING_QUIZ_ERROR, DELETE_QUIZ_ERROR, UPDATE_QUIZ_ERROR, MOVING_QUIZ_ERROR, DUPLICATE_QUIZ_ERROR, COPY_QUIZ_ERROR } = require('../constants/errorCodes');

class QuizController {

    async create(req, res, next) {
        try {
            const { title, content, folderId } = req.body;

            if (!title || !content || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await folderModel.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await model.create(title, content, folderId, req.user.userId);

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

    async get(req, res, next) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }


            const content = await model.getContent(quizId);

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

    async delete(req, res, next) {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const owner = await model.getOwner(quizId);

            if (owner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            const result = await model.delete(quizId);

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

    async update(req, res, next) {
        try {
            const { quizId, newTitle, newContent } = req.body;

            if (!newTitle || !newContent || !quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const owner = await model.getOwner(quizId);

            if (owner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            const result = await model.update(quizId, newTitle, newContent);

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

    async move(req, res, next) {
        try {
            const { quizId, newFolderId } = req.body;

            if (!quizId || !newFolderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this quiz mine
            const quizOwner = await model.getOwner(quizId);

            if (quizOwner != req.user.userId) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            // Is this folder mine
            const folderOwner = await folderModel.getOwner(newFolderId);

            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await model.move(quizId, newFolderId);

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

    
    async copy(req, res, next) {
        const { quizId, newTitle, folderId } = req.body;

        if (!quizId || !newTitle || !folderId) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }

        throw new AppError(NOT_IMPLEMENTED);
        // const { quizId } = req.params;
        // const { newUserId } = req.body;

        // try {
        //     //Trouver le quiz a dupliquer 
        //     const conn = db.getConnection();
        //     const quiztoduplicate = await conn.collection('quiz').findOne({ _id: new ObjectId(quizId) });
        //     if (!quiztoduplicate) {
        //         throw new Error("Quiz non trouvé");
        //     }
        //     console.log(quiztoduplicate);
        //     //Suppression du id du quiz pour ne pas le répliquer 
        //     delete quiztoduplicate._id;
        //     //Ajout du duplicata
        //     await conn.collection('quiz').insertOne({ ...quiztoduplicate, userId: new ObjectId(newUserId) });
        //     res.json(Response.ok("Dossier dupliqué avec succès pour un autre utilisateur"));

        // } catch (error) {
        //     if (error.message.startsWith("Quiz non trouvé")) {
        //         return res.status(404).json(Response.badRequest(error.message));
        //     }
        //     res.status(500).json(Response.serverError(error.message));
        // }
    }

    async deleteQuizzesByFolderId(req, res, next) {
        try {
            const { folderId } = req.body;

            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Call the method from the Quiz model to delete quizzes by folder ID
            await Quiz.deleteQuizzesByFolderId(folderId);

            return res.status(200).json({
                message: 'Quizzes deleted successfully.'
            });
        } catch (error) {
            return next(error);
        }
    }

    async duplicate(req, res, next) {
        const { quizId  } = req.body;

        try {
            const newQuizId = await model.duplicate(quizId,req.user.userId);
            res.status(200).json({ success: true, newQuizId });
        } catch (error) {
            return next(error);
        }
    }

    async quizExists(title, userId) {
        try {
            const existingFile = await model.quizExists(title, userId);
            return existingFile !== null;
        } catch (error) {
            throw new AppError(GETTING_QUIZ_ERROR);
        }
    }

    async Share(req, res, next) {
        try {
            const { quizId, email } = req.body;
    
            if ( !quizId || !email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }            

            const link = `${process.env.FRONTEND_URL}/teacher/Share/${quizId}`;

            emailer.quizShare(email, link);
    
            return res.status(200).json({
                message: 'Quiz  partagé avec succès.'
            });
    
        }
        catch (error) {
            return next(error);
        }
    }    
    
    async getShare(req, res, next) {
        try {
            const { quizId } = req.params;
    
            if ( !quizId ) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }            

            const content = await model.getContent(quizId);

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

    async receiveShare(req, res, next) {
        try {
            const { quizId, folderId } = req.body;
    
            if (!quizId || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const folderOwner = await folderModel.getOwner(folderId);
            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const content = await model.getContent(quizId);
            if (!content) {
                throw new AppError(GETTING_QUIZ_ERROR);
            }
    
            const result = await model.create(content.title, content.content, folderId, req.user.userId);
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

module.exports = new QuizController;