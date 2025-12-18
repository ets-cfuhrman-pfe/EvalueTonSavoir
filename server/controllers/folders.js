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
    
            const startTime = Date.now();
            const result = await this.folders.create(title, req.user.userId);
            const dbOperationTime = Date.now() - startTime;
    
            if (!result) {
                // Log folder creation failure
                if (req.logAction) {
                    req.logAction('folder_creation_failed', {
                        title,
                        reason: 'folder_already_exists',
                        dbOperationTime: `${dbOperationTime}ms`
                    });
                }
                throw new AppError(FOLDER_ALREADY_EXISTS);
            }
    
            // Log successful folder creation
            if (req.logDbOperation) {
                req.logDbOperation('insert', 'folders', dbOperationTime, true, { 
                    folderId: result,
                    title 
                });
            }
            
            if (req.logAction) {
                req.logAction('folder_created', {
                    folderId: result,
                    title,
                    dbOperationTime: `${dbOperationTime}ms`
                });
            }
    
            return res.status(200).json({
                message: 'Dossier créé avec succès.',
                folderId: result
            });
    
        } catch (error) {
            return next(error);
        }
    }
    
    getUserFolders = async (req, res, next) => {
        try {
            const startTime = Date.now();

            // Allow admin to fetch folders for other users by passing ?uid=<userId>
            // Only allow if requester has admin role
            let targetUserId = req.user.userId;
            const uidFromQuery = req.query?.uid;
            if (uidFromQuery && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) {
                targetUserId = uidFromQuery;
            }

            const folders = await this.folders.getUserFolders(targetUserId);
            const dbOperationTime = Date.now() - startTime;
    
            if (!folders) {
                // Log folder not found
                if (req.logDbOperation) {
                    req.logDbOperation('select', 'folders', dbOperationTime, false, {
                        reason: 'no_folders_found'
                    });
                }
                throw new AppError(FOLDER_NOT_FOUND);
            }
    
            // Log successful folder retrieval
            if (req.logDbOperation) {
                req.logDbOperation('select', 'folders', dbOperationTime, true, {
                    folderCount: folders.length
                });
            }
            
            if (req.logAction) {
                // Regular user folder retrieval
                req.logAction('folders_retrieved', {
                    folderCount: folders.length,
                    dbOperationTime: `${dbOperationTime}ms`
                });

                // If an admin fetched folders for another user, log admin audit event
                if (uidFromQuery && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) {
                    req.logAction('admin_get_user_folders', {
                        requestedBy: req.user.userId,
                        targetUserId: targetUserId,
                        folderCount: folders.length,
                        dbOperationTime: `${dbOperationTime}ms`
                    });
                }
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
    
            // Is this folder mine (unless admin requests it)
            const startTime = Date.now();
            const owner = await this.folders.getOwner(folderId);

            if (owner != req.user.userId) {
                // Allow admin to view folder content for others
                if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
                // Log unauthorized folder access attempt
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_folder_access', 'warn', {
                        folderId,
                        attemptedBy: req.user.userId,
                        actualOwner: owner
                    });
                }
                throw new AppError(FOLDER_NOT_FOUND);
            }
            }
    
            const content = await this.folders.getContent(folderId);
            const dbOperationTime = Date.now() - startTime;
    
            if (!content) {
                if (req.logDbOperation) {
                    req.logDbOperation('select', 'folders', dbOperationTime, false, {
                        folderId,
                        reason: 'content_not_found'
                    });
                }
                throw new AppError(GETTING_FOLDER_ERROR);
            }
    
            // Log successful folder content retrieval
            if (req.logDbOperation) {
                req.logDbOperation('select', 'folders', dbOperationTime, true, {
                    folderId,
                    contentCount: content.length
                });
            }
            
            if (req.logAction) {
                // Regular user folder content access
                req.logAction('folder_content_accessed', {
                    folderId,
                    contentCount: content.length,
                    dbOperationTime: `${dbOperationTime}ms`
                });

                // If an admin accessed another user's folder content, log admin audit event
                if (owner && owner !== req.user.userId && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) {
                    req.logAction('admin_get_user_folder_content', {
                        requestedBy: req.user.userId,
                        folderId,
                        targetUserId: owner,
                        contentCount: content.length,
                        dbOperationTime: `${dbOperationTime}ms`
                    });
                }
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
            const { folderId } = req.params;
            const { newTitle } = req.body;
    
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
