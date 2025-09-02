/**
 * Shared validation constants used by both frontend and backend
 * This ensures consistency between client-side and server-side validation
 */

/**
 * @typedef {Object} ValidationRule
 * @property {number} [minLength] - Minimum length for strings
 * @property {number} [maxLength] - Maximum length for strings
 * @property {number} [min] - Minimum value for numbers
 * @property {number} [max] - Maximum value for numbers
 * @property {RegExp} [pattern] - Regular expression pattern
 * @property {string} errorMessage - Error message to display
 */

/**
 * @typedef {Object} ValidationConstants
 * @property {Object} room - Room validation rules
 * @property {ValidationRule} room.name
 * @property {ValidationRule} room.description
 * @property {ValidationRule} room.password
 * @property {ValidationRule} room.maxParticipants
 * @property {Object} user - User validation rules
 * @property {ValidationRule} user.email
 * @property {ValidationRule} user.password
 * @property {ValidationRule} user.username
 * @property {Object} quiz - Quiz validation rules
 * @property {ValidationRule} quiz.title
 * @property {ValidationRule} quiz.content
 * @property {Object} folder - Folder validation rules
 * @property {ValidationRule} folder.title
 * @property {Object} text - Text validation rules
 * @property {ValidationRule} text.short
 * @property {ValidationRule} text.long
 * @property {Object} numerical - Numerical validation rules
 * @property {ValidationRule} numerical.answer
 */

/**
 * Shared validation constants for both client and server
 * @type {ValidationConstants}
 */
const VALIDATION_CONSTANTS = {
    room: {
        name: {
            minLength: 1,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9\-_\s]+$/,
            errorMessage: 'Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces'
        },
        description: {
            maxLength: 500,
            errorMessage: 'La description ne peut pas dépasser 500 caractères'
        },
        password: {
            minLength: 4,
            maxLength: 50,
            errorMessage: 'Le mot de passe doit contenir entre 4 et 50 caractères'
        },
        maxParticipants: {
            min: 1,
            max: 100,
            integer: true,
            errorMessage: 'Le nombre maximum de participants doit être entre 1 et 100'
        }
    },
    user: {
        email: {
            minLength: 3,
            maxLength: 254,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            errorMessage: 'L\'adresse email doit être valide'
        },
        password: {
            minLength: 8,
            maxLength: 128,
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
            errorMessage: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
        },
        username: {
            minLength: 2,
            maxLength: 30,
            pattern: /^[a-zA-Z0-9]+$/,
            errorMessage: 'Le nom d\'utilisateur ne peut contenir que des lettres et des chiffres'
        }
    },
    quiz: {
        title: {
            minLength: 1,
            maxLength: 100,
            errorMessage: 'Le titre du quiz doit contenir entre 1 et 100 caractères'
        },
        content: {
            minLength: 1,
            maxLength: 50000,
            errorMessage: 'Le contenu du quiz doit contenir entre 1 et 50000 caractères'
        }
    },
    folder: {
        title: {
            minLength: 1,
            maxLength: 100,
            errorMessage: 'Le titre du dossier doit contenir entre 1 et 100 caractères'
        }
    },
    text: {
        short: {
            maxLength: 500,
            errorMessage: 'Le texte ne peut pas dépasser 500 caractères'
        },
        long: {
            maxLength: 5000,
            errorMessage: 'Le texte ne peut pas dépasser 5000 caractères'
        }
    },
    numerical: {
        answer: {
            min: -1000000,
            max: 1000000,
            errorMessage: 'La réponse doit être un nombre entre -1000000 et 1000000'
        }
    }
};

// Export for both CommonJS (Node.js) and ES modules (TypeScript/modern JS)
module.exports = VALIDATION_CONSTANTS;
// For ES6 import compatibility
module.exports.default = VALIDATION_CONSTANTS;
