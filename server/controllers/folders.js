//controller
const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, FOLDER_NOT_FOUND, FOLDER_ALREADY_EXISTS, GETTING_FOLDER_ERROR, DELETE_FOLDER_ERROR, UPDATE_FOLDER_ERROR, DUPLICATE_FOLDER_ERROR, COPY_FOLDER_ERROR } = require('../constants/errorCodes');

// controllers must use arrow functions to bind 'this' to the class instance in order to access class properties as callbacks in Express
class FoldersController {

    constructor(foldersModel) {
        this.folders = foldersModel;
    }

    /***
     * Basic queries
     */
    create = async (req, res, next) => {
        try {
            const { title } = req.body;
    
            if (!title) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const result = await this.folders.create(title, req.user.userId);
    
            if (!result) {
                throw new AppError(FOLDER_ALREADY_EXISTS);
            }
    
            return res.status(200).json({
                message: 'Dossier créé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    getUserFolders = async (req, res, next) => {
        try {
            const folders = await this.folders.getUserFolders(req.user.userId);
    
            if (!folders) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            return res.status(200).json({
                data: folders
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    getFolderContent = async (req, res, next) => {
        try {
            const { folderId } = req.params;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const content = await this.folders.getContent(folderId);
    
            if (!content) {
                throw new AppError(GETTING_FOLDER_ERROR);
            }
    
            return res.status(200).json({
                data: content
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    delete = async (req, res, next) => {
        try {
            const { folderId } = req.params;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const result = await this.folders.delete(folderId);
    
            if (!result) {
                throw new AppError(DELETE_FOLDER_ERROR);
            }
    
            return res.status(200).json({
                message: 'Dossier supprimé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    rename = async (req, res, next) => {
        try {
            const { folderId, newTitle } = req.body;
    
            if (!folderId || !newTitle) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            // Is this the new title already taken by another folder that I own?
            const exists = await this.folders.folderExists(newTitle, req.user.userId);

            if (exists) {
                throw new AppError(FOLDER_ALREADY_EXISTS);
            }

            const result = await this.folders.rename(folderId, req.user.userId, newTitle);
    
            if (!result) {
                throw new AppError(UPDATE_FOLDER_ERROR);
            }
    
            return res.status(200).json({
                message: 'Dossier mis à jours avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    duplicate = async (req, res, next) => {
        try {
            const { folderId } = req.body;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const userId = req.user.userId;
    
            const newFolderId = await this.folders.duplicate(folderId, userId);
    
            if (!newFolderId) {
                throw new AppError(DUPLICATE_FOLDER_ERROR);
            }
    
            return res.status(200).json({
                message: 'Dossier dupliqué avec succès.',
                newFolderId: newFolderId
            });
        } catch (error) {
            return next(error);
        }
    }
    
    copy = async (req, res, next) => {
        try {
            const { folderId, newTitle } = req.body;
    
            if (!folderId || !newTitle) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const userId = req.user.userId; // Assuming userId is obtained from authentication
    
            const newFolderId = await this.folders.copy(folderId, userId);
    
            if (!newFolderId) {
                throw new AppError(COPY_FOLDER_ERROR);
            }
    
            return res.status(200).json({
                message: 'Dossier copié avec succès.',
                newFolderId: newFolderId
            });
        } catch (error) {
            return next(error);
        }
    }
    
    getFolderById = async (req, res, next) => {
        try {
            const { folderId } = req.params;
    
            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // Is this folder mine
            const owner = await this.folders.getOwner(folderId);
    
            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            const folder = await this.folders.getFolderById(folderId);
    
            if (!folder) {
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            return res.status(200).json({
                data: folder
            });
        } catch (error) {
            return next(error);
        }
    }
    
    folderExists = async (req, res, next) => {
        try {
            const { title } = req.body;
    
            if (!title) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const userId = req.user.userId;
    
            // Vérifie si le dossier existe pour l'utilisateur donné
            const exists = await this.folders.folderExists(title, userId);
    
            return res.status(200).json({
                exists: exists
            });
        } catch (error) {
            return next(error);
        }
    }

}



module.exports = FoldersController;
