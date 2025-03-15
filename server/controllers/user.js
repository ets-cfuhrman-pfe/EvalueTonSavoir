const emailer = require('../config/email.js');
const jwt = require('../middleware/jwtToken.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, LOGIN_CREDENTIALS_ERROR, GENERATE_PASSWORD_ERROR, UPDATE_PASSWORD_ERROR, DELETE_USER_ERROR } = require('../constants/errorCodes.js');

// controllers must use arrow functions to bind 'this' to the class instance in order to access class properties as callbacks in Express
class UserController {

    constructor(userModel) {
        this.users = userModel;
    }

    register = async (req, res, next) => {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            if (!this.users) {
                throw new AppError('Users model not found');
            }
            await this.users.register(email, password);
    
            emailer.registerConfirmation(email);
    
            return res.status(200).json({
                message: 'Utilisateur créé avec succès.'
            });
    
        } catch (error) {
            return next(error);
        }
    }
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            if (!this) {
                throw new AppError('UsersController not initialized');
            }

            const user = await this.users.login(email, password);

            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }

            const token = jwt.create(user.email, user._id);

            return res.status(200).json({ token });
        } catch (error) {
            next(error);
        }
    }

    resetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
    
            if (!email) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            const newPassword = await this.users.resetPassword(email);
    
            if (!newPassword) {
                throw new AppError(GENERATE_PASSWORD_ERROR);
            }
    
            emailer.newPasswordConfirmation(email, newPassword);
    
            return res.status(200).json({
                message: 'Nouveau mot de passe envoyé par courriel.'
            });
        } catch (error) {
            return next(error);
        }
    }
    
    changePassword = async (req, res, next) => {
        try {
            const { email, oldPassword, newPassword } = req.body;
    
            if (!email || !oldPassword || !newPassword) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // verify creds first
            const user = await this.users.login(email, oldPassword);
    
            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }
    
            const password = await this.users.changePassword(email, newPassword);
    
            if (!password) {
                throw new AppError(UPDATE_PASSWORD_ERROR);
            }
    
            return res.status(200).json({
                message: 'Mot de passe changé avec succès.'
            });
        } catch (error) {
            return next(error);
        }
    }
    
    delete = async (req, res, next) => {
        try {
            const { email, password } = req.body;
    
            if (!email || !password) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }
    
            // verify creds first
            const user = await this.users.login(email, password);
    
            if (!user) {
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }
    
            const result = await this.users.delete(email);
    
            if (!result) {
                throw new AppError(DELETE_USER_ERROR);
            }
    
            return res.status(200).json({
                message: 'Utilisateur supprimé avec succès'
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = UserController;
