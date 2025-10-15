const ValidationUtils = require('../utils/validationUtils');
const AppError = require('./AppError');
const { VALIDATION_ERROR } = require('../constants/errorCodes');
const logger = require('../config/logger');

/**
 * Generic validation middleware factory
 * @param {Object} fieldConfig - Configuration object mapping field names to validation methods and requirements
 * @param {boolean} allowPartial - Whether to allow partial validation (for updates)
 * @returns {Function} Express middleware function
 * 
 * Example fieldConfig:
 * {
 *   email: { validator: 'validateEmail', required: true, label: 'Email' },
 *   password: { validator: 'validatePassword', required: true, label: 'Mot de passe' },
 *   title: { validator: 'validateQuizTitle', required: false, label: 'Titre' }
 * }
 */
const createValidationMiddleware = (fieldConfig, allowPartial = false) => {
    return (req, res, next) => {
        const errors = [];
        
        for (const [fieldName, config] of Object.entries(fieldConfig)) {
            const value = req.body[fieldName];
            const isRequired = config.required && !allowPartial;
            const fieldLabel = config.label || fieldName;
            
            // Check if field is missing and required
            if ((value === undefined || value === null || value === '') && isRequired) {
                errors.push(`${fieldLabel} requis`);
                continue;
            }
            
            // Skip validation if field is not provided and partial validation is allowed
            if ((value === undefined || value === null || value === '') && allowPartial) {
                continue;
            }
            
            // Validate the field if it has a value and a validator is specified
            if (value !== undefined && value !== null && value !== '' && config.validator) {
                const validationMethod = ValidationUtils[config.validator];
                if (validationMethod) {
                    const result = validationMethod.call(ValidationUtils, value);
                    if (!result.isValid) {
                        errors.push(...result.errors);
                    }
                } else {
                    logger.warn(`Validation method ${config.validator} not found`, {
                        field: fieldName,
                        validator: config.validator,
                        availableValidators: Object.keys(ValidationUtils)
                    });
                }
            }
        }
        
        if (errors.length > 0) {
            // Log validation failures with detailed context
            logger.warn('Validation failed', {
                errors: errors,
                fieldConfig: Object.keys(fieldConfig),
                receivedFields: Object.keys(req.body),
                url: req.originalUrl,
                method: req.method,
                userId: req.user?.userId || null,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                requestId: req.requestId,
                module: 'validation-middleware'
            });

            // Log security event for suspicious validation patterns
            if (errors.length > 5 || errors.some(err => 
                String(err).toLowerCase().includes('script') || 
                String(err).toLowerCase().includes('injection') ||
                String(err).toLowerCase().includes('xss')
            )) {
                logger.logSecurityEvent('suspicious_validation_failure', 'warn', {
                    errorCount: errors.length,
                    errors: errors,
                    url: req.originalUrl,
                    userId: req.user?.userId || null,
                    ip: req.ip
                });
            }

            const error = new AppError(VALIDATION_ERROR(`Données invalides: ${errors.join(', ')}`));
            return next(error);
        }

        // Log successful validation for audit purposes (debug level)
        logger.debug('Validation passed', {
            validatedFields: Object.keys(fieldConfig),
            url: req.originalUrl,
            method: req.method,
            userId: req.user?.userId || null,
            requestId: req.requestId,
            module: 'validation-middleware'
        });
        
        next();
    };
};

/**
 * Validation configurations for different entities
 */
const validationConfigs = {
    userRegistration: {
        email: { validator: 'validateEmail', required: true, label: 'Email' },
        username: { validator: 'validateUsername', required: true, label: 'Nom d\'utilisateur' }
    },
    
    userLogin: {
        email: { validator: 'validateEmail', required: true, label: 'Email' },
        // For login, we don't validate password format, just check if it exists
        password: { validator: null, required: true, label: 'Mot de passe' }
    },
    
    emailOnly: {
        email: { validator: 'validateEmail', required: true, label: 'Email' }
    },
    
    passwordChange: {
        email: { validator: 'validateEmail', required: true, label: 'Email' },
        // For old password, we don't validate format, just check if it exists
        oldPassword: { validator: null, required: true, label: 'Ancien mot de passe' },
        // For SSO, we won't validate new password format locally
        newPassword: { validator: null, required: true, label: 'Nouveau mot de passe' }
    },
    
    quizCreation: {
        title: { validator: 'validateQuizTitle', required: true, label: 'Titre' },
        content: { validator: 'validateQuizContent', required: true, label: 'Contenu' }
    },
    
    folderCreation: {
        title: { validator: 'validateFolderTitle', required: true, label: 'Titre' }
    },
    
    folderRename: {
        folderId: { validator: null, required: true, label: 'ID du dossier' },
        newTitle: { validator: 'validateFolderTitle', required: true, label: 'Nouveau titre' }
    },
    
    folderCopy: {
        newTitle: { validator: 'validateFolderTitle', required: true, label: 'Titre' }
    },
    
    roomCreation: {
        title: { validator: 'validateRoomName', required: true, label: 'Titre' }
    },
    
    roomRename: {
        roomId: { validator: null, required: true, label: 'ID de la salle' },
        newTitle: { validator: 'validateRoomName', required: true, label: 'Nouveau titre' }
    }
};

// Create middleware instances using the factory
const validateUserRegistration = createValidationMiddleware(validationConfigs.userRegistration);
const validateUserLogin = createValidationMiddleware(validationConfigs.userLogin);
const validateEmailOnly = createValidationMiddleware(validationConfigs.emailOnly);
const validatePasswordChange = createValidationMiddleware(validationConfigs.passwordChange);
const validateQuizCreation = createValidationMiddleware(validationConfigs.quizCreation);
const validateQuizUpdate = createValidationMiddleware(validationConfigs.quizCreation, true); // Allow partial
const validateFolderCreation = createValidationMiddleware(validationConfigs.folderCreation);
const validateFolderRename = createValidationMiddleware(validationConfigs.folderRename);
const validateFolderCopy = createValidationMiddleware(validationConfigs.folderCopy);
const validateRoomCreation = createValidationMiddleware(validationConfigs.roomCreation);
const validateRoomRename = createValidationMiddleware(validationConfigs.roomRename);

module.exports = {
    // Middleware instances
    validateUserRegistration,
    validateUserLogin,
    validateEmailOnly,
    validatePasswordChange,
    validateQuizCreation,
    validateQuizUpdate,
    validateFolderCreation,
    validateFolderRename,
    validateFolderCopy,
    validateRoomCreation,
    validateRoomRename,
    
    // Factory function for custom validation
    createValidationMiddleware,
    
    // Validation configurations (for reference or extension)
    validationConfigs
};