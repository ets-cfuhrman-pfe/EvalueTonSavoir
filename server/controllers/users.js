const emailer = require('../config/email.js');
const model = require('../models/users.js');
const jwt = require('../middleware/jwtToken.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, LOGIN_CREDENTIALS_ERROR, GENERATE_PASSWORD_ERROR, UPDATE_PASSWORD_ERROR, DELETE_USER_ERROR } = require('../constants/errorCodes');

class UsersController {

    async delete(req, res, next) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // verify creds first
            const user = await model.login(email, password);

            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }

            const result = await model.delete(email)

            if (!result) {
                throw new AppError(DELETE_USER_ERROR)
            }

            return res.status(200).json({
                message: 'Utilisateur supprimé avec succès'
            });
        }
        catch (error) {
            return next(error);
        }
    }

}

module.exports = new UsersController;