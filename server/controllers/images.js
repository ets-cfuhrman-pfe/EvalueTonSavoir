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
    
            const id = await this.images.upload(file, req.user.userId);
    
            return res.status(200).json({
                id: id
            });
        } catch (error) {
            return next(error);
        }
    };
    
    get = async (req, res, next) => {
        try {
            const { id } = req.params;
    
            if (!id) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const image = await this.images.get(id);
    
            if (!image) {
                throw new AppError(IMAGE_NOT_FOUND);
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
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const images = await this.images.getImages(page, limit);

            if (!images || images.length === 0) {
                throw new AppError(IMAGE_NOT_FOUND);
            }
            
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(images);
        } catch (error) {
            return next(error);
        }
    };

    getUserImages = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 5;
            const uid = req.query.uid;
            const images = await this.images.getUserImages(page, limit, uid);
    
            if (!images || images.length === 0) {
                throw new AppError(IMAGE_NOT_FOUND);
            }
            
            res.setHeader('Content-Type', 'application/json');
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
            const images = await this.images.delete(uid, imgId);
            
            res.setHeader('Content-Type', 'application/json');
            return res.status(200).json(images);
        } catch (error) {
            return next(error);
        }
    };

}

module.exports = ImagesController;
