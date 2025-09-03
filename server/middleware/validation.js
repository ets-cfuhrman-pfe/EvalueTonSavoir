const ValidationUtils = require('../utils/validationUtils');

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
                    console.warn(`Validation method ${config.validator} not found`);
                }
            }
        }
        
        if (errors.length > 0) {
            const error = new Error();
            error.statusCode = 400;
            error.message = `Données invalides: ${errors.join(', ')}`;
            return next(error);
        }
        
        next();
    };
};

/**
 * Validation configurations for different entities
 */
const validationConfigs = {
    userRegistration: {
        email: { validator: 'validateEmail', required: true, label: 'Email' },
        password: { validator: 'validatePassword', required: true, label: 'Mot de passe' },
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
        newPassword: { validator: 'validatePassword', required: true, label: 'Nouveau mot de passe' }
    },
    
    quizCreation: {
        title: { validator: 'validateQuizTitle', required: true, label: 'Titre' },
        content: { validator: 'validateQuizContent', required: true, label: 'Contenu' }
    },
    
    folderCreation: {
        title: { validator: 'validateFolderTitle', required: true, label: 'Titre' }
    },
    
    roomCreation: {
        name: { validator: 'validateRoomName', required: true, label: 'Nom de la salle' },
        description: { validator: 'validateRoomDescription', required: false, label: 'Description' },
        maxParticipants: { validator: 'validateRoomMaxParticipants', required: false, label: 'Nombre maximum de participants' },
        password: { validator: 'validateRoomPassword', required: false, label: 'Mot de passe' }
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
const validateRoomCreation = createValidationMiddleware(validationConfigs.roomCreation);

module.exports = {
    // Middleware instances
    validateUserRegistration,
    validateUserLogin,
    validateEmailOnly,
    validatePasswordChange,
    validateQuizCreation,
    validateQuizUpdate,
    validateFolderCreation,
    validateRoomCreation,
    
    // Factory function for custom validation
    createValidationMiddleware,
    
    // Validation configurations (for reference or extension)
    validationConfigs
};