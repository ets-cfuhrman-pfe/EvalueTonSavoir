/**
 * Data sanitization utilities for quiz security
 * Removes sensitive information from quiz data based on user roles
 */

/**
 * Sanitizes question data for student users
 * Removes correct answers, explanations, hints, and other sensitive information
 * @param {Object|Array} questions - Question data to sanitize
 * @returns {Object|Array} Sanitized question data safe for students
 */
function sanitizeQuestionsForStudents(questions) {
  if (!questions) return questions;

  // Handle both single question and array of questions
  const questionsArray = Array.isArray(questions) ? questions : [questions];

  const sanitized = questionsArray.map(item => {
    if (!item || typeof item !== 'object') return item;

    // Create a copy to avoid modifying the original
    const sanitizedItem = { ...item };

    // If this item has a 'question' property, it's a wrapper object
    if (sanitizedItem.question && typeof sanitizedItem.question === 'object') {
      sanitizedItem.question = sanitizeQuestionObject(sanitizedItem.question);
    } else {
      // This item is a direct question object
      return sanitizeQuestionObject(sanitizedItem);
    }

    return sanitizedItem;
  });

  // Return single object if input was single object, otherwise return array
  return Array.isArray(questions) ? sanitized : sanitized[0];
}

function sanitizeQuestionObject(question) {
  if (!question || typeof question !== 'object') return question;
  
  const sanitizedQuestion = { ...question };

  // Remove sensitive fields that students shouldn't see
  const sensitiveFields = [
    'correctAnswer',
    'explanation',
    'hints',
    'metadata',
    'grading',
    'feedback'
  ];

  sensitiveFields.forEach(field => {
    delete sanitizedQuestion[field];
  });

  // Sanitize options to remove isCorrect flags and feedback (standard format)
  if (sanitizedQuestion.options && Array.isArray(sanitizedQuestion.options)) {
    sanitizedQuestion.options = sanitizedQuestion.options.map(option => {
      const sanitizedOption = { ...option };
      delete sanitizedOption.isCorrect;
      delete sanitizedOption.feedback;
      return sanitizedOption;
    });
  }

  // Sanitize choices to remove isCorrect flags and feedback (GIFT format)
  // For numerical questions, sanitize the answer values while keeping type information
  if (sanitizedQuestion.choices && Array.isArray(sanitizedQuestion.choices)) {
    if (sanitizedQuestion.type === 'Numerical') {
      // For numerical questions, keep type but remove actual answer values
      sanitizedQuestion.choices = sanitizedQuestion.choices.map(choice => {
        const sanitizedChoice = { ...choice };
        // Remove actual number values but keep type
        if (sanitizedChoice.type === 'simple' && 'number' in sanitizedChoice) {
          delete sanitizedChoice.number;
        } else if (sanitizedChoice.type === 'range' && 'number' in sanitizedChoice) {
          delete sanitizedChoice.number;
          delete sanitizedChoice.range;
        } else if (sanitizedChoice.type === 'high-low' && 'numberLow' in sanitizedChoice) {
          delete sanitizedChoice.numberLow;
          delete sanitizedChoice.numberHigh;
        }
        return sanitizedChoice;
      });
    } else {
      // For other question types, remove isCorrect, feedback, and weight
      sanitizedQuestion.choices = sanitizedQuestion.choices.map(choice => {
        const sanitizedChoice = { ...choice };
        delete sanitizedChoice.isCorrect;
        delete sanitizedChoice.feedback;
        delete sanitizedChoice.weight;
        return sanitizedChoice;
      });
    }
  }

  return sanitizedQuestion;
}

/**
 * Sanitizes question data for teacher users
 * Teachers get full access to all question data
 * @param {Object|Array} questions - Question data (unchanged for teachers)
 * @returns {Object|Array} Original question data
 */
function sanitizeQuestionsForTeachers(questions) {
  // Teachers get full access - no sanitization needed
  return questions;
}

/**
 * Main sanitization function that routes based on user role
 * @param {Object|Array} questions - Question data to sanitize
 * @param {string} userRole - User role ('teacher' or 'student')
 * @returns {Object|Array} Sanitized question data based on role
 */
function sanitizeQuestions(questions, userRole) {
  if (!userRole) {
    console.warn('dataSanitizer: No user role provided, defaulting to student sanitization');
    return sanitizeQuestionsForStudents(questions);
  }

  switch (userRole.toLowerCase()) {
    case 'teacher':
    case 'admin':
      return sanitizeQuestionsForTeachers(questions);
    case 'student':
    default:
      return sanitizeQuestionsForStudents(questions);
  }
}

/**
 * Determines user role based on socket metadata, JWT token, or socket actions
 * In this application:
 * - Teachers authenticate and create rooms (have JWT tokens)
 * - Students can join rooms without authentication (no JWT tokens)
 * @param {Object} socket - Socket.IO socket object
 * @returns {string} User role ('teacher' or 'student')
 */
function getUserRole(socket) {
  try {
    // First, check if we already determined the role and stored it
    if (socket.userData && socket.userData.role) {
      return socket.userData.role;
    }

    // Try to get JWT token from socket handshake query parameters
    const token = socket.handshake.query.token || socket.handshake.auth?.token;
    
    if (!token || token === '') {
      // No token means unauthenticated user (student joining a room)
      return 'student';
    }

    // Verify and decode the JWT token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extract roles from the decoded token
    if (decoded.roles && Array.isArray(decoded.roles)) {
      // Prioritize teacher/admin role if present
      if (decoded.roles.includes('teacher') || decoded.roles.includes('admin')) {
        return 'teacher';
      }
      if (decoded.roles.includes('student')) {
        return 'student';
      }
    }
    
    console.warn('dataSanitizer: No valid roles found in JWT token, defaulting to student');
    return 'student';
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      // Invalid or expired token - treat as student (unauthenticated)
      return 'student';
    }
    console.error('dataSanitizer: Error decoding JWT token:', error.message);
    // Default to student role for security (more restrictive)
    return 'student';
  }
}

/**
 * Sets user role in socket metadata for future reference
 * @param {Object} socket - Socket.IO socket object
 * @param {string} role - User role to set
 */
function setUserRole(socket, role) {
  if (!socket.userData) {
    socket.userData = {};
  }
  socket.userData.role = role;
}

module.exports = {
  sanitizeQuestionsForStudents,
  sanitizeQuestionsForTeachers,
  sanitizeQuestions,
  getUserRole,
  setUserRole
};
