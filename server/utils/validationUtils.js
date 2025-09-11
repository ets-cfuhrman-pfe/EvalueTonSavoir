const VALIDATION_CONSTANTS = require('../shared/validationConstants.json');

/**
 * Utility functions for server-side validation using shared constants
 */
class ValidationUtils {
    
    /**
     * Validate a field against its validation rule
     */
    static validateField(value, rule) {
        const errors = [];

        // If value is empty and there's no minLength requirement, consider it valid
        if (!value || value === '') {
            if (rule.minLength && rule.minLength > 0) {
                errors.push(rule.errorMessage);
            }
            return { isValid: errors.length === 0, errors };
        }

        const stringValue = String(value);
        
        // Check if value is only whitespace
        if (stringValue.trim() === '' && rule.minLength && rule.minLength > 0) {
            errors.push(rule.errorMessage);
            return { isValid: false, errors };
        }

        // Check minLength
        if (rule.minLength !== undefined && stringValue.length < rule.minLength) {
            errors.push(rule.errorMessage);
        }

        // Check maxLength
        if (rule.maxLength !== undefined && stringValue.length > rule.maxLength) {
            errors.push(rule.errorMessage);
        }

        // Check pattern
        if (rule.pattern && !new RegExp(rule.pattern).test(stringValue)) {
            errors.push(rule.errorMessage);
        }

        // Check numeric constraints
        if (rule.min !== undefined || rule.max !== undefined) {
            const numValue = Number(value);
            if (isNaN(numValue)) {
                errors.push(rule.errorMessage);
            } else {
                // Check if integer is required
                if (rule.integer && !Number.isInteger(numValue)) {
                    errors.push('La valeur doit être un nombre entier');
                }
                
                if (rule.min !== undefined && numValue < rule.min) {
                    errors.push(rule.errorMessage);
                }
                if (rule.max !== undefined && numValue > rule.max) {
                    errors.push(rule.errorMessage);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate room name
     */
    static validateRoomName(name) {
        return this.validateField(name, VALIDATION_CONSTANTS.room.name);
    }

    /**
     * Validate room description
     */
    static validateRoomDescription(description) {
        return this.validateField(description, VALIDATION_CONSTANTS.room.description);
    }

    /**
     * Validate room password
     */
    static validateRoomPassword(password) {
        return this.validateField(password, VALIDATION_CONSTANTS.room.password);
    }

    /**
     * Validate room max participants
     */
    static validateRoomMaxParticipants(maxParticipants) {
        return this.validateField(maxParticipants, VALIDATION_CONSTANTS.room.maxParticipants);
    }

    /**
     * Validate complete room creation data
     */
    static validateRoomCreation(data) {
        const errors = [];

        // Validate room name
        const nameResult = this.validateRoomName(data.name);
        if (!nameResult.isValid) {
            errors.push(...nameResult.errors);
        }

        // Validate description if provided
        if (data.description !== undefined && data.description !== '') {
            const descResult = this.validateRoomDescription(data.description);
            if (!descResult.isValid) {
                errors.push(...descResult.errors);
            }
        }

        // Validate max participants
        const maxParticipantsResult = this.validateRoomMaxParticipants(data.maxParticipants);
        if (!maxParticipantsResult.isValid) {
            errors.push(...maxParticipantsResult.errors);
        }

        // Validate password if room is private
        if (data.isPrivate) {
            if (!data.password || data.password.trim() === '') {
                errors.push('Le mot de passe est requis pour une salle privée');
            } else {
                const passwordResult = this.validateRoomPassword(data.password);
                if (!passwordResult.isValid) {
                    errors.push(...passwordResult.errors);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate user email
     */
    static validateEmail(email) {
        return this.validateField(email, VALIDATION_CONSTANTS.user.email);
    }

    /**
     * Validate username
     */
    static validateUsername(username) {
        return this.validateField(username, VALIDATION_CONSTANTS.user.username);
    }

    /**
     * Validate quiz title
     */
    static validateQuizTitle(title) {
        return this.validateField(title, VALIDATION_CONSTANTS.quiz.title);
    }

    /**
     * Validate quiz content
     */
    static validateQuizContent(content) {
        return this.validateField(content, VALIDATION_CONSTANTS.quiz.content);
    }

    /**
     * Validate folder title
     */
    static validateFolderTitle(title) {
        return this.validateField(title, VALIDATION_CONSTANTS.folder.title);
    }
}

module.exports = ValidationUtils;
