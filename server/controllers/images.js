const model = require('../models/images.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, IMAGE_NOT_FOUND } = require('../constants/errorCodes');

class ImagesController {

    async upload(req, res, next) {
        try {
            const file = req.file;

            if (!file) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const id = await model.upload(file, req.user.userId);

            return res.status(200).json({
                id: id
            });
        }
        catch (error) {
            return next(error);
        }

    }

    async get(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const image = await model.get(id);

            if (!image) {
                throw new AppError(IMAGE_NOT_FOUND)
            }

            // Set Headers for display in browser
            res.setHeader('Content-Type', image.mime_type);
            res.setHeader('Content-Disposition', 'inline; filename=' + image.file_name);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.send(image.file_content);
        }
        catch (error) {
            return next(error);
        }
    }

}

module.exports = new ImagesController;