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
      title:  'Content',
      content:'A'.repeat(validationConstants.quiz.title.maxLength + 1),
    },
    OVERSIZED_CONTENT: {
      title: 'Title',
      content: 'A'.repeat(validationConstants.quiz.content.maxLength + 1),
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

// COMMON VALIDATION MESSAGES 
const COMMON_MESSAGES = {
  VALIDATION: {
    REQUIRED_FIELD: (field) => `${field} requis`,
    FIELD_TOO_LONG: (field, min, max) => `${field} doit contenir entre ${min} et ${max} caractères`,
    INVALID_FORMAT: (field) => `Format ${field} invalide`,
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
} = require('../../constants/errorCodes');

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



module.exports = {
  HTTP_STATUS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
  COMMON_MESSAGES,
  QUIZ_MESSAGES,
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
};
