const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, IMAGE_NOT_FOUND } = require('../constants/errorCodes');

class ImagesController {

    constructor(imagesModel) {
        this.images = imagesModel;
    }

    upload = async (req, res, next) => {
        try {
            const file = req.file;
    
            if (!file) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const startTime = Date.now();
            const id = await this.images.upload(file, req.user.userId);
            const uploadTime = Date.now() - startTime;
    
            // Log successful image upload
            if (req.logDbOperation) {
                req.logDbOperation('insert', 'images', uploadTime, true, {
                    imageId: id,
                    fileName: file.originalname,
                    fileSize: file.size,
                    mimeType: file.mimetype
                });
            }
            
            if (req.logAction) {
                req.logAction('image_uploaded', {
                    imageId: id,
                    fileName: file.originalname,
                    fileSize: `${(file.size / 1024).toFixed(2)}KB`,
                    mimeType: file.mimetype,
                    uploadTime: `${uploadTime}ms`
                });
            }
    
            return res.status(200).json({
                id: id
            });
        } catch (error) {
            // Log upload failure
            if (req.logAction && req.file) {
                req.logAction('image_upload_failed', {
                    fileName: req.file.originalname,
                    fileSize: req.file.size,
                    error: error.message
                });
            }
            return next(error);
        }
    };
    
    get = async (req, res, next) => {
        try {
            const { id } = req.params;
    
            if (!id) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const startTime = Date.now();
            const image = await this.images.get(id);
            const retrievalTime = Date.now() - startTime;
    
            if (!image) {
                // Log image not found
                if (req.logDbOperation) {
                    req.logDbOperation('select', 'images', retrievalTime, false, {
                        imageId: id,
                        reason: 'image_not_found'
                    });
                }
                throw new AppError(IMAGE_NOT_FOUND);
            }
    
            // Log successful image retrieval
            if (req.logDbOperation) {
                req.logDbOperation('select', 'images', retrievalTime, true, {
                    imageId: id,
                    fileSize: image.file_content?.length || 0,
                    mimeType: image.mime_type
                });
            }
            
            if (req.logAction) {
                req.logAction('image_accessed', {
                    imageId: id,
                    fileName: image.file_name,
                    fileSize: `${((image.file_content?.length || 0) / 1024).toFixed(2)}KB`,
                    mimeType: image.mime_type,
                    retrievalTime: `${retrievalTime}ms`
                });
            }

            // Admin-specific access audit: if admin views another user's image
            if (image.userId && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin') && req.user.userId !== image.userId) {
                if (req.logAction) {
                    req.logAction('admin_access_image', {
                        requestedBy: req.user.userId,
                        targetUserId: image.userId,
                        imageId: id,
                        fileName: image.file_name,
                        retrievalTime: `${retrievalTime}ms`
                    });
                }
            }
    
            // Set Headers for display in browser
            res.setHeader('Content-Type', image.mime_type);
            res.setHeader('Content-Disposition', 'inline; filename=' + image.file_name);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.send(image.file_content);
        } catch (error) {
            return next(error);
        }
    };

    getImages = async (req, res, next) => {
        try {
            const page = Number.parseInt(req.query.page) || 1;
            const limit = Number.parseInt(req.query.limit) || 5;
            const images = await this.images.getImages(page, limit);

            if (!images || images.length === 0) {
                throw new AppError(IMAGE_NOT_FOUND);
            }
            
            res.setHeader('Content-Type', 'application/json');
            // If admin requested images for another user (uid query param present), log admin action
            const uidFromQuery = req.query?.uid;
            if (uidFromQuery && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) {
                if (req.logAction) {
                    req.logAction('admin_get_user_images', {
                        requestedBy: req.user.userId,
                        targetUserId: uidFromQuery,
                        page,
                        limit,
                        imageCount: images.length
                    });
                }
            }
            return res.status(200).json(images);
        } catch (error) {
            return next(error);
        }
    };

    getUserImages = async (req, res, next) => {
        try {
            const page = Number.parseInt(req.query.page) || 1;
            const limit = Number.parseInt(req.query.limit) || 5;
            const uid = req.query.uid;
            const images = await this.images.getUserImages(page, limit, uid);
    
            if (!images || images.length === 0) {
                throw new AppError(IMAGE_NOT_FOUND);
            }
            
            res.setHeader('Content-Type', 'application/json');

            // If an admin requested images for another user (uid query param present), log admin action
            const uidFromQuery = req.query?.uid;
            if (uidFromQuery && req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin')) {
                if (req.logAction) {
                    req.logAction('admin_get_user_images', {
                        requestedBy: req.user.userId,
                        targetUserId: uidFromQuery,
                        page,
                        limit,
                        imageCount: images.length
                    });
                }
            }
            return res.status(200).json(images);
        } catch (error) {
            return next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const uid = req.query.uid;
            const imgId = req.query.imgId;
            
            if (!uid || !imgId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
            
            // Security check - log if user trying to delete someone else's image
            if (req.user && req.user.userId !== uid) {
                if (req.logSecurity) {
                    req.logSecurity('unauthorized_image_delete_attempt', 'warn', {
                        attemptedBy: req.user.userId,
                        targetUserId: uid,
                        imageId: imgId
                    });
                }
            }
            
            const startTime = Date.now();
            const images = await this.images.delete(uid, imgId);
            const deleteTime = Date.now() - startTime;
            
            // Log successful image deletion
            if (req.logDbOperation) {
                req.logDbOperation('delete', 'images', deleteTime, true, {
                    imageId: imgId,
                    targetUserId: uid
                });
            }
            
            if (req.logAction) {
                req.logAction('image_deleted', {
                    imageId: imgId,
                    targetUserId: uid,
                    deleteTime: `${deleteTime}ms`
                });
            }
            // If admin deleted an image for another user, log audit event
            if (req.user && Array.isArray(req.user.roles) && req.user.roles.includes('admin') && req.user.userId !== uid) {
                if (req.logAction) {
                    req.logAction('admin_delete_user_image', {
                        requestedBy: req.user.userId,
                        targetUserId: uid,
                        imageId: imgId,
                        deleteTime: `${deleteTime}ms`
                    });
                }
            }
            
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(images);
        } catch (error) {
            return next(error);
        }
    };

}

module.exports = ImagesController;
