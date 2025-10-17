//Test constants
const validationConstants = require('../../shared/validationConstants.json');


// HTTP STATUS CODES
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// TEST IDs - Standard identifiers for mock entities
const TEST_IDS = {
  QUIZ: 'quiz123',
  QUIZ_NEW: 'newQuiz123',
  FOLDER: 'folder123',
  FOLDER_NEW: 'folder_new_123',
  ROOM: 'room123',
  ROOM_NEW: 'room_new_123',
  USER: 'user123',
  IMAGE: 'image123',
  IMAGE_NEW: 'image_new_123',
};

// TEST USERS - Standard user profiles
const TEST_USERS = {
  DEFAULT: {
    email: 'test@example.com',
    userId: 'user123',
    roles: ['user'],
    password: 'password123',
  },
  OWNER: {
    email: 'owner@example.com',
    userId: 'owner123',
    roles: ['user'],
  },
  OTHER: {
    email: 'other@example.com',
    userId: 'other123',
    roles: ['user'],
  },
  ADMIN: {
    email: 'admin@example.com',
    userId: 'admin123',
    roles: ['admin', 'user'],
  },
};

// TEST DATA - Reusable test data sets
const TEST_DATA = {
  QUIZ: {
    VALID: {
      title: 'Valid Quiz Title',
      content: 'Valid quiz content',
    },
    MINIMAL: {
      title: 'Q',
      content: 'C',
    },
    MAX_TITLE: {
      title: 'A'.repeat(validationConstants.quiz.title.maxLength),
      content: 'Content',
    },
    MAX_CONTENT: {
      title: 'Title',
      content: 'A'.repeat(validationConstants.quiz.content.maxLength),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(validationConstants.quiz.title.maxLength + 1),
      content: 'Valid content',
    },
    OVERSIZED_CONTENT: {
      title: 'Title',
      content: 'A'.repeat(validationConstants.quiz.content.maxLength + 1),
    },
    ARRAY_CONTENT: {
      title: 'Array Quiz',
      content: ['Question 1?', 'Question 2?', 'Question 3?'],
    },
    EXISTING: {
      title: 'Existing Quiz',
      content: 'Existing quiz content',
    },
    CONCURRENT: {
      title: 'Concurrent Quiz',
      content: 'Concurrent quiz content',
    },
    NEW_CONTENT: {
      title: 'Updated Quiz',
      content: 'New content',
    },
    INVALID_CONTENT: {
      title: 'Invalid Quiz',
      content: 'not an array',
    },
  },
  FOLDER: {
    VALID: {
      title: 'Valid Folder Name',
    },
    MINIMAL: {
      title: 'F',
    },
    MAX_TITLE: {
      title: 'A'.repeat(validationConstants.folder.title.maxLength),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(validationConstants.folder.title.maxLength + 1),
    },
  },
  ROOM: {
    VALID: {
      title: 'Valid Room Name',
    },
    MINIMAL: {
      title: 'R',
    },
    MAX_TITLE: {
      title: 'A'.repeat(validationConstants.room.name.maxLength),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(validationConstants.room.name.maxLength + 1),
    },
    MAX_PARTICIPANTS: {
      min: validationConstants.room.maxParticipants.min,
      max: validationConstants.room.maxParticipants.max,
    },
  },
  USER: {
    VALID: {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
    },
    VALID_LOGIN: {
      email: 'test@example.com',
      password: 'password123',
    },
    VALID_USERNAME: {
      username: 'testuser',
    },
    INVALID :{
      email: 'invalid-email',
    }
  },
  IMAGE: {
    VALID: {
      name: 'test.jpg',
      size: 102400,
      type: 'image/jpeg',
    },
    
    MAX_SIZE: 5242880, 
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
};

// ERROR CONSTANTS
const AppError = require('../../middleware/AppError');
const {
  QUIZ_ALREADY_EXISTS,
  MISSING_REQUIRED_PARAMETER,
  NOT_IMPLEMENTED,
  QUIZ_NOT_FOUND,
  FOLDER_NOT_FOUND,
  GETTING_QUIZ_ERROR,
  DELETE_QUIZ_ERROR,
  UPDATE_QUIZ_ERROR,
  MOVING_QUIZ_ERROR,
  GETTING_ROOM_ERROR,
  ROOM_NOT_FOUND,
  DELETE_ROOM_ERROR,
  ROOM_ALREADY_EXISTS,
  UPDATE_ROOM_ERROR,
} = require('../../constants/errorCodes');


// COMMON VALIDATION MESSAGES 
const COMMON_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: (field) => `${field} requis`,
    FIELD_TOO_LONG: (field, min, max) => `${field} doit contenir entre ${min} et ${max} caractères`,
    INVALID_FORMAT: (field) => `Format ${field} invalide`,
    SUCCESSFUL_UPDATE: "mis à jour avec succès",
  },
  AUTH: {
    ACCESS_DENIED: "Accès refusé. Aucun jeton fourni.",
    INVALID_TOKEN: "Jeton invalide.",
  },
  GENERIC: {
    OPERATION_SUCCESS: (operation) => `${operation} avec succès.`,
    OPERATION_FAILED: (operation) => `Échec de ${operation}.`,
  }
};


// QUIZ-SPECIFIC MESSAGES
const QUIZ_MESSAGES = {
  SUCCESS: {
    CREATED: "Quiz créé avec succès.",
    DELETED: "Quiz supprimé avec succès.",
    UPDATED: "Quiz mis à jours avec succès.", 
    MOVED: "Quiz déplacé avec succès.",
    SHARED: "Quiz  partagé avec succès.", 
    RECEIVED_SHARE: "Quiz partagé reçu.",
  },
  VALIDATION: {
    TITLE_REQUIRED: "Titre requis",
    CONTENT_REQUIRED: "Contenu requis",
    TITLE_LENGTH: validationConstants.quiz.title.errorMessage,
    CONTENT_LENGTH: validationConstants.quiz.content.errorMessage,
  },
  ERRORS: {
    ALREADY_EXISTS: "Le quiz existe déjà.",
    NOT_FOUND: "Quiz non trouvé.",
  }
};

// ROOM-SPECIFIC MESSAGES
const ROOM_MESSAGES = {
  SUCCESS: {
    CREATED: "Salle créée avec succès.",
    DELETED: "Salle supprimé avec succès.",
    UPDATED: "Salle mis à jour avec succès.",
  },
  VALIDATION: {
    TITLE_REQUIRED: "Titre requis",
    TITLE_LENGTH: validationConstants.room.name.errorMessage,
    ALREADY_EXISTS: "Une salle avec ce nom existe déjà",
    INVALID_DATA: "Données invalides",
    ID_REQUIRED: "ID de la salle requis",
    NEW_TITLE_REQUIRED: "Nouveau titre requis",
  },
  ERRORS: {
    NOT_FOUND: "Salle non trouvée.",
    CONTENT_NOT_FOUND: "Impossible de charger le contenu de la salle.",
  }
};

// USER-SPECIFIC MESSAGES
const USER_MESSAGES = {
  SUCCESS: {
    CREATED: "Utilisateur créé avec succès.",
    PASSWORD_RESET: "Nouveau mot de passe envoyé par courriel.",
    PASSWORD_CHANGED: "Mot de passe changé avec succès.",
    DELETED: "Utilisateur supprimé avec succès",
  },
  VALIDATION: {
    EMAIL_REQUIRED: "Données invalides: Email requis",
    USERNAME_REQUIRED: "Données invalides: Nom d'utilisateur requis",
    EMAIL_INVALID: "Données invalides: L'adresse email doit être valide",
    USERNAME_INVALID: "Données invalides: Le nom d'utilisateur ne peut contenir que des lettres, des chiffres, des virgules et des espaces",
    PASSWORD_REQUIRED: "Données invalides: Mot de passe requis",
    OLD_PASSWORD_REQUIRED: "Données invalides: Ancien mot de passe requis",
    NEW_PASSWORD_REQUIRED: "Données invalides: Nouveau mot de passe requis",
  },
  ERRORS: {
    INVALID_CREDENTIALS: "L'email et le mot de passe ne correspondent pas.",
    ALREADY_EXISTS: "L'utilisateur existe déjà.",
    PASSWORD_RESET_FAILED: "Une erreur s'est produite lors de la création d'un nouveau mot de passe.",
    USER_DELETION_FAILED: "Une erreur s'est produite lors de suppression de l'utilisateur.",
  }
};



module.exports = {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  QUIZ_MESSAGES,
  ROOM_MESSAGES,
  USER_MESSAGES,
  AppError,
  QUIZ_ALREADY_EXISTS,
  MISSING_REQUIRED_PARAMETER,
  NOT_IMPLEMENTED,
  QUIZ_NOT_FOUND,
  FOLDER_NOT_FOUND,
  GETTING_QUIZ_ERROR,
  DELETE_QUIZ_ERROR,
  UPDATE_QUIZ_ERROR,
  MOVING_QUIZ_ERROR,
  GETTING_ROOM_ERROR,
  ROOM_NOT_FOUND,
  DELETE_ROOM_ERROR,
  ROOM_ALREADY_EXISTS,
  UPDATE_ROOM_ERROR,
  validationConstants,
};
