const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, IMAGE_NOT_FOUND } = require('../constants/errorCodes');

class AdminController {

    constructor(model) {
        this.model = model;
    }

    get = async (req, res, next) => {
        try {
            const users = await this.model.getUsers();
    
            return res.status(200).json({
                users: users
            });
        } catch (error) {
            return next(error);
        }
    };
    
    delete = async (req, res, next) => {
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

}

module.exports = AdminController;
