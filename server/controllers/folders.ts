//controller
const model = require('../models/folders.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, NOT_IMPLEMENTED, FOLDER_NOT_FOUND, FOLDER_ALREADY_EXISTS, GETTING_FOLDER_ERROR, DELETE_FOLDER_ERROR, UPDATE_FOLDER_ERROR, MOVING_FOLDER_ERROR, DUPLICATE_FOLDER_ERROR, COPY_FOLDER_ERROR } = require('../constants/errorCodes');

class FoldersController {

    /***
     * Basic queries
     */
    async create(req, res, next) {
        try {
            const { title } = req.body;

            if (!title) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = await model.create(title, req.user.userId);

            if (!result) {
                throw new AppError(FOLDER_ALREADY_EXISTS);
            }

            return res.status(200).json({
                message: 'Dossier créé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async getUserFolders(req, res, next) {

        try {
            const folders = await model.getUserFolders(req.user.userId);

            if (!folders) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            return res.status(200).json({
                data: folders
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async getFolderContent(req, res, next) {
        try {
            const { folderId } = req.params;

            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const content = await model.getContent(folderId);

            if (!content) {
                throw new AppError(GETTING_FOLDER_ERROR);
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
            const { folderId } = req.params;

            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await model.delete(folderId);

            if (!result) {
                throw new AppError(DELETE_FOLDER_ERROR);
            }

            return res.status(200).json({
                message: 'Dossier supprimé avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }

    async rename(req, res, next) {
        try {
            const { folderId, newTitle } = req.body;

            if (!folderId || !newTitle) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const result = await model.rename(folderId, newTitle);

            if (!result) {
                throw new AppError(UPDATE_FOLDER_ERROR);
            }

            return res.status(200).json({
                message: 'Dossier mis à jours avec succès.'
            });

        }
        catch (error) {
            return next(error);
        }
    }


    async duplicate(req, res, next) {
        try {
            const { folderId,  } = req.body;

            if (!folderId ) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const userId = req.user.userId; 

            const newFolderId = await model.duplicate(folderId, userId);

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

    async copy(req, res, next) {
        try {
            const { folderId, newTitle } = req.body;

            if (!folderId || !newTitle) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const userId = req.user.userId; // Assuming userId is obtained from authentication

            const newFolderId = await model.copy(folderId, userId);

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
    
    async getFolderById(req, res, next) {
        try {
            const { folderId } = req.params;

            if (!folderId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this folder mine
            const owner = await model.getOwner(folderId);

            if (owner != req.user.userId) {
                throw new AppError(FOLDER_NOT_FOUND);
            }

            const folder = await model.getFolderById(folderId);

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

    async folderExists(req, res, next) {
        try {
            const { title } = req.body;
    
            if (!title) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const userId = req.user.userId; 
    
            // Vérifie si le dossier existe pour l'utilisateur donné
            const exists = await model.folderExists(title, userId);
    
            return res.status(200).json({
                exists: exists
            });
        } catch (error) {
            return next(error);
        }
    }


}



module.exports = new FoldersController;