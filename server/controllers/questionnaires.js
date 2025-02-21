const emailer = require('../config/email.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, NOT_IMPLEMENTED, QUESTIONNAIRE_NOT_FOUND, FOLDER_NOT_FOUND, QUESTIONNAIRE_ALREADY_EXISTS, GETTING_QUESTIONNAIRE_ERROR, DELETE_QUESTIONNAIRE_ERROR, UPDATE_QUESTIONNAIRE_ERROR, MOVING_QUESTIONNAIRE_ERROR } = require('../constants/errorCodes.js');

class QuestionnairesController {

    constructor(questionnaireModel, foldersModel) {
        this.questionnaires = questionnaireModel;
        this.folders = foldersModel;
    }

    create = async (req, res, next) => {
        try {
            const { title, content, folderId } = req.body;
    
            if (!title || !content || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const result = await this.questionnaires.create(title, content, folderId, req.user.userId);
    
            if (!result) {
                throw new AppError(QUESTIONNAIRE_ALREADY_EXISTS);
            }
    
            return res.status(200).json({
                message: 'Questionnaire créé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    get = async (req, res, next) => {
        try {
            const { questionnaireId: questionnaireId } = req.params;
    
            if (!questionnaireId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const content = await this.questionnaires.getContent(questionnaireId);
    
            if (!content) {
                throw new AppError(GETTING_QUESTIONNAIRE_ERROR);
            }
    
            // Is this questionnaire mine
            if (content.userId != req.user.userId) {
                throw new AppError(QUESTIONNAIRE_NOT_FOUND);
            }
    
            return res.status(200).json({
                data: content
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    delete = async (req, res, next) => {
        try {
            const { questionnaireId: questionnaireId } = req.params;
    
            if (!questionnaireId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this questionnaire mine
            const owner = await this.questionnaires.getOwner(questionnaireId);
    
            if (owner != req.user.userId) {
                throw new AppError(QUESTIONNAIRE_NOT_FOUND);
            }
    
            const result = await this.questionnaires.delete(questionnaireId);
    
            if (!result) {
                throw new AppError(DELETE_QUESTIONNAIRE_ERROR);
            }
    
            return res.status(200).json({
                message: 'Questionnaire supprimé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    update = async (req, res, next) => {
        try {
            const { questionnaireId: questionnaireId, newTitle, newContent } = req.body;
    
            if (!newTitle || !newContent || !questionnaireId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this questionnaire mine
            const owner = await this.questionnaires.getOwner(questionnaireId);
    
            if (owner != req.user.userId) {
                throw new AppError(QUESTIONNAIRE_NOT_FOUND);
            }
    
            const result = await this.questionnaires.update(questionnaireId, newTitle, newContent);
    
            if (!result) {
                throw new AppError(UPDATE_QUESTIONNAIRE_ERROR);
            }
    
            return res.status(200).json({
                message: 'Questionnaire mis à jours avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    move = async (req, res, next) => {
        try {
            const { questionnaireId: questionnaireId, newFolderId } = req.body;
    
            if (!questionnaireId || !newFolderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this questionnaire mine
            const questionnaireOwner = await this.questionnaires.getOwner(questionnaireId);
    
            if (questionnaireOwner != req.user.userId) {
                throw new AppError(QUESTIONNAIRE_NOT_FOUND);
            }
    
            // Is this folder mine
            const folderOwner = await this.folders.getOwner(newFolderId);
    
            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const result = await this.questionnaires.move(questionnaireId, newFolderId);
    
            if (!result) {
                throw new AppError(MOVING_QUESTIONNAIRE_ERROR);
            }
    
            return res.status(200).json({
                message: 'Utilisateur déplacé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    copy = async (req, _res, _next) => {
        const { questionnaireId, newTitle, folderId } = req.body;
    
        if (!questionnaireId || !newTitle || !folderId) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }
    
        throw new AppError(NOT_IMPLEMENTED);
        // const { questionnaireId } = req.params;
        // const { newUserId } = req.body;
    
        // try {
        //     //Trouver le questionnaire a dupliquer 
        //     const conn = db.getConnection();
        //     const questionnaireToDuplicate = await conn.collection('questionnaire').findOne({ _id: ObjectId.createFromHexString(questionnaireId) });
        //     if (!questionnaireToDuplicate) {
        //         throw new Error("Questionnaire non trouvé");
        //     }
        //     console.log(questionnaireToDuplicate);
        //     //Suppression du id du questionnaire pour ne pas le répliquer 
        //     delete questionnaireToDuplicate._id;
        //     //Ajout du duplicata
        //     await conn.collection('questionnaire').insertOne({ ...questionnaireToDuplicate, userId: ObjectId.createFromHexString(newUserId) });
        //     res.json(Response.ok("Dossier dupliqué avec succès pour un autre utilisateur"));
    
        // } catch (error) {
        //     if (error.message.startsWith("Questionnaire non trouvé")) {
        //         return res.status(404).json(Response.badRequest(error.message));
        //     }
        //     res.status(500).json(Response.serverError(error.message));
        // }
    };
    
    removeQuestionnairesByFolderId = async (req, res, next) => {
        try {
            const { folderId } = req.body;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Call the method from the Questionnaire model to delete questionnaires by folder ID
            await this.questionnaires.deleteQuestionnairesByFolderId(folderId);
    
            return res.status(200).json({
                message: 'Questionnaires deleted successfully.'
            });
        } catch (error) {
            return next(error);
        }
    };
    
    duplicate = async (req, res, next) => {
        const { questionnaireId } = req.body;
    
        try {
            const newQuestionnaireId = await this.questionnaires.duplicate(questionnaireId, req.user.userId);
            res.status(200).json({ success: true, newQuestionnaireId });
        } catch (error) {
            return next(error);
        }
    };
    
    questionnaireExists = async (title, userId) => {
        try {
            const existingFile = await this.questionnaires.questionnaireExists(title, userId);
            return existingFile !== null;
        } catch (_error) {
            throw new AppError(GETTING_QUESTIONNAIRE_ERROR);
        }
    };
    
    share = async (req, res, next) => {
        try {
            const { questionnaireId, email } = req.body;
    
            if (!questionnaireId || !email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const link = `${process.env.FRONTEND_URL}/teacher/Share/${questionnaireId}`;
    
            emailer.questionnaireShare(email, link);
    
            return res.status(200).json({
                message: 'Questionnaire partagé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    getShare = async (req, res, next) => {
        try {
            const { questionnaireId } = req.params;
    
            if (!questionnaireId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const content = await this.questionnaires.getContent(questionnaireId);
    
            if (!content) {
                throw new AppError(GETTING_QUESTIONNAIRE_ERROR);
            }
    
            return res.status(200).json({
                data: content.title
            });
    
        } catch (error) {
            return next(error);
        }
    };
    
    receiveShare = async (req, res, next) => {
        try {
            const { questionnaireId, folderId } = req.body;
    
            if (!questionnaireId || !folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const folderOwner = await this.folders.getOwner(folderId);
            if (folderOwner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const content = await this.questionnaires.getContent(questionnaireId);
            if (!content) {
                throw new AppError(GETTING_QUESTIONNAIRE_ERROR);
            }
    
            const result = await this.questionnaires.create(content.title, content.content, folderId, req.user.userId);
            if (!result) {
                throw new AppError(QUESTIONNAIRE_ALREADY_EXISTS);
            }
    
            return res.status(200).json({
                message: 'Questionnaire partagé reçu.'
            });
        } catch (error) {
            return next(error);
        }
    };    

}

module.exports = QuestionnairesController;
