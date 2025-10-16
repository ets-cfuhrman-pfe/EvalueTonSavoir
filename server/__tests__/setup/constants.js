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


// VALIDATION CONSTRAINTS 
const CONSTRAINTS = {
  QUIZ: {
    TITLE: {
      MIN: validationConstants.quiz.title.minLength,
      MAX: validationConstants.quiz.title.maxLength,
    },
    CONTENT: {
      MIN: validationConstants.quiz.content.minLength,
      MAX: validationConstants.quiz.content.maxLength,
    },
  },
  FOLDER: {
    TITLE: {
      MIN: validationConstants.folder.title.minLength,
      MAX: validationConstants.folder.title.maxLength,
    },
  },
  ROOM: {
    TITLE: {
      MIN: validationConstants.room.name.minLength,
      MAX: validationConstants.room.name.maxLength,
    },
    MAX_PARTICIPANTS: {
      MIN: validationConstants.room.maxParticipants.min,
      MAX: validationConstants.room.maxParticipants.max,
    },
    PASSWORD: {
      MIN: validationConstants.room.password.minLength,
      MAX: validationConstants.room.password.maxLength,
    },
  },
  USER: {
    EMAIL: {
      MIN: validationConstants.user.email.minLength,
      MAX: validationConstants.user.email.maxLength,
    },
    PASSWORD: {
      MIN: validationConstants.user.password.minLength,
      MAX: validationConstants.user.password.maxLength,
    },
    USERNAME: {
      MIN: validationConstants.user.username.minLength,
      MAX: validationConstants.user.username.maxLength,
    },
  },
  IMAGE: {
    MAX_SIZE: 5242880, 
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
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
      title: 'A'.repeat(CONSTRAINTS.QUIZ.TITLE.MAX),
      content: 'Content',
    },
    MAX_CONTENT: {
      title: 'Title',
      content: 'A'.repeat(CONSTRAINTS.QUIZ.CONTENT.MAX),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(CONSTRAINTS.QUIZ.TITLE.MAX + 1),
      content: 'Content',
    },
    OVERSIZED_CONTENT: {
      title: 'Title',
      content: 'A'.repeat(CONSTRAINTS.QUIZ.CONTENT.MAX + 1),
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
      title: 'A'.repeat(CONSTRAINTS.FOLDER.TITLE.MAX),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(CONSTRAINTS.FOLDER.TITLE.MAX + 1),
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
      title: 'A'.repeat(CONSTRAINTS.ROOM.TITLE.MAX),
    },
    OVERSIZED_TITLE: {
      title: 'A'.repeat(CONSTRAINTS.ROOM.TITLE.MAX + 1),
    },
    MAX_PARTICIPANTS: {
      min: CONSTRAINTS.ROOM.MAX_PARTICIPANTS.MIN,
      max: CONSTRAINTS.ROOM.MAX_PARTICIPANTS.MAX,
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
  },
};

module.exports = {
  HTTP_STATUS,
  CONSTRAINTS,
  TEST_IDS,
  TEST_USERS,
  TEST_DATA,
};
