const emailer = require('../config/email.js');
const jwt = require('../middleware/jwtToken.js');

const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, LOGIN_CREDENTIALS_ERROR, GENERATE_PASSWORD_ERROR, UPDATE_PASSWORD_ERROR, DELETE_USER_ERROR, UNAUTHORIZED_ACCESS_DENIED } = require('../constants/errorCodes');

// controllers must use arrow functions to bind 'this' to the class instance in order to access class properties as callbacks in Express
class UsersController {

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

            const startTime = Date.now();
            await this.users.register(email, password);
            const dbOperationTime = Date.now() - startTime;
            
            // Log database operation
            if (req.logDbOperation) {
                req.logDbOperation('insert', 'users', dbOperationTime, true, { email });
            }

            // Log user action
            if (req.logAction) {
                req.logAction('user_register', { 
                    email, 
                    registrationMethod: 'email',
                    dbOperationTime: `${dbOperationTime}ms`
                });
            }

            emailer.registerConfirmation(email);
    
            return res.status(200).json({
                message: 'Utilisateur créé avec succès.'
            });
    
        } catch (error) {
            // Log registration failure
            if (req.logSecurity) {
                req.logSecurity('registration_failed', 'warn', {
                    email: req.body?.email,
                    error: error.message
                });
            }
            return next(error);
        }
    }
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const startTime = Date.now();

            if (!email || !password) {
                // Log missing credentials attempt
                if (req.logSecurity) {
                    req.logSecurity('login_missing_credentials', 'warn', {
                        hasEmail: !!email,
                        hasPassword: !!password
                    });
                }
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            if (!this) {
                throw new AppError('UsersController not initialized');
            }

            // Log login attempt
            if (req.logAction) {
                req.logAction('user_login_attempt', {
                    email: email,
                    method: 'email_password'
                });
            }

            const user = await this.users.login(email, password);
            const dbOperationTime = Date.now() - startTime;

            if (!user) {
                // Log failed login
                if (req.logSecurity) {
                    req.logSecurity('login_credentials_invalid', 'warn', {
                        email: email,
                        dbOperationTime: `${dbOperationTime}ms`
                    });
                }
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }


            const token = jwt.create(user.email, user._id, user.roles);
            const totalTime = Date.now() - startTime;

            // Log successful login
            if (req.logAction) {
                req.logAction('user_login_success', {
                    userId: user._id,
                    email: user.email,
                    totalTime: `${totalTime}ms`,
                    dbTime: `${dbOperationTime}ms`
                });
            }

            return res.status(200).json({ token });
        } catch (error) {
            // Log login failure
            if (req.logSecurity) {
                req.logSecurity('user_login_failed', 'warn', {
                    email: req.body?.email,
                    error: error.message,
                    errorCode: error.statusCode
                });
            }
            next(error);
        }
    }

    resetPassword = async (req, res, next) => {
        try {
            const { email } = req.body;
            const startTime = Date.now();
    
            if (!email) {
                // Log missing email for password reset
                if (req.logSecurity) {
                    req.logSecurity('password_reset_missing_email', 'warn', {});
                }
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Log password reset attempt
            if (req.logAction) {
                req.logAction('password_reset_attempt', {
                    email: email
                });
            }
    
            const newPassword = await this.users.resetPassword(email);
            const dbOperationTime = Date.now() - startTime;
    
            if (!newPassword) {
                // Log password generation failure
                if (req.logAction) {
                    req.logAction('password_reset_failed', {
                        email: email,
                        reason: 'password_generation_failed',
                        dbOperationTime: `${dbOperationTime}ms`
                    });
                }
                throw new AppError(GENERATE_PASSWORD_ERROR);
            }

            // Log database operation
            if (req.logDbOperation) {
                req.logDbOperation('update', 'users', dbOperationTime, true, {
                    email: email,
                    operation: 'password_reset'
                });
            }
    
            emailer.newPasswordConfirmation(email, newPassword);
            const totalTime = Date.now() - startTime;

            // Log successful password reset
            if (req.logAction) {
                req.logAction('password_reset_success', {
                    email: email,
                    totalTime: `${totalTime}ms`,
                    dbTime: `${dbOperationTime}ms`,
                    emailSent: true
                });
            }
    
            return res.status(200).json({
                message: 'Nouveau mot de passe envoyé par courriel.'
            });
        } catch (error) {
            // Log password reset failure
            if (req.logSecurity) {
                req.logSecurity('password_reset_failed', 'error', {
                    email: req.body?.email,
                    error: error.message,
                    errorCode: error.statusCode
                });
            }
            return next(error);
        }
    }
    
    changePassword = async (req, res, next) => {
        try {
            const { email, oldPassword, newPassword } = req.body;
            const startTime = Date.now();
    
            if (!email || !oldPassword || !newPassword) {
                // Log missing parameters for password change
                if (req.logSecurity) {
                    req.logSecurity('password_change_missing_params', 'warn', {
                        hasEmail: !!email,
                        hasOldPassword: !!oldPassword,
                        hasNewPassword: !!newPassword,
                        userId: req.user?.userId
                    });
                }
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Log password change attempt
            if (req.logAction) {
                req.logAction('password_change_attempt', {
                    email: email,
                    userId: req.user?.userId
                });
            }
    
            // verify creds first
            const verifyStartTime = Date.now();
            const user = await this.users.login(email, oldPassword);
            const verifyTime = Date.now() - verifyStartTime;
    
            if (!user) {
                // Log invalid credentials for password change
                if (req.logSecurity) {
                    req.logSecurity('password_change_invalid_credentials', 'warn', {
                        email: email,
                        userId: req.user?.userId,
                        verifyTime: `${verifyTime}ms`
                    });
                }
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }

            const changeStartTime = Date.now();
            const password = await this.users.changePassword(email, newPassword);
            const changeTime = Date.now() - changeStartTime;
            const totalTime = Date.now() - startTime;
    
            if (!password) {
                // Log password update failure
                if (req.logAction) {
                    req.logAction('password_change_failed', {
                        email: email,
                        userId: user._id,
                        reason: 'password_update_failed',
                        totalTime: `${totalTime}ms`
                    });
                }
                throw new AppError(UPDATE_PASSWORD_ERROR);
            }

            // Log database operations
            if (req.logDbOperation) {
                req.logDbOperation('select', 'users', verifyTime, true, {
                    userId: user._id,
                    email: email,
                    operation: 'credential_verification'
                });
                req.logDbOperation('update', 'users', changeTime, true, {
                    userId: user._id,
                    email: email,
                    operation: 'password_change'
                });
            }

            // Log successful password change
            if (req.logAction) {
                req.logAction('password_change_success', {
                    userId: user._id,
                    email: email,
                    totalTime: `${totalTime}ms`,
                    verifyTime: `${verifyTime}ms`,
                    changeTime: `${changeTime}ms`
                });
            }
    
            return res.status(200).json({
                message: 'Mot de passe changé avec succès.'
            });
        } catch (error) {
            // Log password change failure
            if (req.logSecurity) {
                req.logSecurity('password_change_failed', 'error', {
                    email: req.body?.email,
                    userId: req.user?.userId,
                    error: error.message,
                    errorCode: error.statusCode
                });
            }
            return next(error);
        }
    }
    
    delete = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const startTime = Date.now();
    
            if (!email || !password) {
                // Log missing parameters for user deletion
                if (req.logSecurity) {
                    req.logSecurity('user_delete_missing_params', 'warn', {
                        hasEmail: !!email,
                        hasPassword: !!password,
                        userId: req.user?.userId
                    });
                }
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Log user deletion attempt (CRITICAL security event)
            if (req.logSecurity) {
                req.logSecurity('user_delete_attempt', 'warn', {
                    email: email,
                    requestedBy: req.user?.userId,
                    selfDelete: req.user?.email === email
                });
            }
    
            // verify creds first
            const verifyStartTime = Date.now();
            const user = await this.users.login(email, password);
            const verifyTime = Date.now() - verifyStartTime;
    
            if (!user) {
                // Log invalid credentials for user deletion
                if (req.logSecurity) {
                    req.logSecurity('user_delete_invalid_credentials', 'error', {
                        email: email,
                        requestedBy: req.user?.userId,
                        verifyTime: `${verifyTime}ms`
                    });
                }
                throw new AppError(LOGIN_CREDENTIALS_ERROR);
            }

            const deleteStartTime = Date.now();
            const result = await this.users.delete(email);
            const deleteTime = Date.now() - deleteStartTime;
            const totalTime = Date.now() - startTime;
    
            if (!result) {
                // Log user deletion failure
                if (req.logSecurity) {
                    req.logSecurity('user_delete_failed', 'error', {
                        userId: user._id,
                        email: email,
                        requestedBy: req.user?.userId,
                        reason: 'delete_operation_failed',
                        totalTime: `${totalTime}ms`
                    });
                }
                throw new AppError(DELETE_USER_ERROR);
            }

            // Log database operations
            if (req.logDbOperation) {
                req.logDbOperation('select', 'users', verifyTime, true, {
                    userId: user._id,
                    email: email,
                    operation: 'credential_verification_for_delete'
                });
                req.logDbOperation('delete', 'users', deleteTime, true, {
                    userId: user._id,
                    email: email,
                    operation: 'user_deletion'
                });
            }

            // Log successful user deletion (CRITICAL audit event)
            if (req.logSecurity) {
                req.logSecurity('user_delete_success', 'warn', {
                    deletedUserId: user._id,
                    deletedUserEmail: email,
                    requestedBy: req.user?.userId,
                    totalTime: `${totalTime}ms`,
                    verifyTime: `${verifyTime}ms`,
                    deleteTime: `${deleteTime}ms`,
                    selfDelete: req.user?.email === email
                });
            }
    
            return res.status(200).json({
                message: 'Utilisateur supprimé avec succès'
            });
        } catch (error) {
            // Log user deletion failure (CRITICAL security event)
            if (req.logSecurity) {
                req.logSecurity('user_delete_error', 'error', {
                    email: req.body?.email,
                    requestedBy: req.user?.userId,
                    error: error.message,
                    errorCode: error.statusCode
                });
            }
            return next(error);
        }
    }

    getAllUsers = async (req, res, next) => {
        try {
            // Check if user has admin role
            if (!req.user || !req.user.roles || !req.user.roles.includes('admin')) {
                throw new AppError(UNAUTHORIZED_ACCESS_DENIED);
            }

            const startTime = Date.now();
            const users = await this.users.getAllUsers();

            const usersWithCreatedAt = users.map(u => ({
                ...u,
                createdAt: u.created_at || u.createdAt || null
            }));
            const dbOperationTime = Date.now() - startTime;

            // Log database operation
            if (req.logDbOperation) {
                req.logDbOperation('select', 'users', dbOperationTime, true);
            }

            // Log admin action
            if (req.logAction) {
                req.logAction('admin_get_all_users', {
                    requestedBy: req.user.userId,
                    userCount: users.length,
                    dbOperationTime: `${dbOperationTime}ms`
                });
            }

            return res.status(200).json({
                users: usersWithCreatedAt
            });

        } catch (error) {
            // Log admin action failure
            if (req.logSecurity) {
                req.logSecurity('admin_get_all_users_error', 'error', {
                    requestedBy: req.user?.userId,
                    error: error.message
                });
            }
            return next(error);
        }
    }
}

module.exports = UsersController;
