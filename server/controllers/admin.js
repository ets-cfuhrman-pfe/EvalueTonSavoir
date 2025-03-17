const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, IMAGE_NOT_FOUND } = require('../constants/errorCodes');

class AdminController {

    constructor(model) {
        this.model = model;
    }

    getUsers = async (req, res, next) => {
        try {
            const users = await this.model.getUsers();
    
            return res.status(200).json({
                users: users
            });
        } catch (error) {
            return next(error);
        }
    };

    getStats = async (req, res, next) => {
        try {
            const data = await this.model.getStats();
    
            return res.status(200).json({ data });
        } catch (error) {
            return next(error);
        }
    };

    getImages = async (req, res, next) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const imgs = await this.model.getImages(page, limit);
    
            return res.status(200).json({ data: imgs });
        } catch (error) {
            return next(error);
        }
    };
    
    deleteUser = async (req, res, next) => {
        try {
            const { id } = req.params;
    
            if (!id) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const user = await this.model.deleteUser(id);
    
            if (!user) {
                throw new AppError(IMAGE_NOT_FOUND);
            }

            return res.status(200).json({ user: user });
        } catch (error) {
            return next(error);
        }
    };
    
    deleteImage = async (req, res, next) => {
        try {
            const { imgId } = req.query;
            if (!imgId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const deleted = await this.model.deleteImage(imgId);
    
            if (!deleted) {
                throw new AppError(IMAGE_NOT_FOUND);
            }

            return res.status(200).json({ deleted });
        } catch (error) {
            return next(error);
        }
    };

}

module.exports = AdminController;
