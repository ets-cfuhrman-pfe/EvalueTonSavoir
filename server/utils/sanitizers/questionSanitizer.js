/**
 * Main question sanitization utilities
 * Orchestrates the sanitization of different question types
 */

const { SENSITIVE_FIELDS } = require('./sanitizerConfig');
const { sanitizeNumericalChoice } = require('./numericalSanitizer');
const { sanitizeChoices, sanitizeOptions } = require('./choiceSanitizer');

/**
 * Sanitizes a question object for student users
 * @param {Object} question - Question object to sanitize
 * @returns {Object} Sanitized question object
 */
function sanitizeQuestionObject(question) {
  if (!question || typeof question !== 'object') return question;

  const sanitizedQuestion = { ...question };

  // Remove common sensitive fields
  SENSITIVE_FIELDS.common.forEach(field => {
    delete sanitizedQuestion[field];
  });

  // Remove question-type specific fields
  if (SENSITIVE_FIELDS.byType[question.type]) {
    SENSITIVE_FIELDS.byType[question.type].forEach(field => {
      delete sanitizedQuestion[field];
    });
  }

  // Sanitize options (standard format)
  if (sanitizedQuestion.options && Array.isArray(sanitizedQuestion.options)) {
    sanitizedQuestion.options = sanitizeOptions(sanitizedQuestion.options, question.type);
  }

  // Sanitize choices (GIFT format)
  if (sanitizedQuestion.choices && Array.isArray(sanitizedQuestion.choices)) {
    if (question.type === 'Numerical') {
      // Use numerical-specific sanitization for numerical questions
      sanitizedQuestion.choices = sanitizedQuestion.choices.map(choice =>
        sanitizeNumericalChoice(choice)
      );
    } else {
      // Use general choice sanitization for other types
      sanitizedQuestion.choices = sanitizeChoices(sanitizedQuestion.choices, question.type);
    }
  }

  return sanitizedQuestion;
}

/**
 * Sanitizes question data for student users
 * @param {Object|Array} questions - Question data to sanitize
 * @returns {Object|Array} Sanitized question data
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

/**
 * Sanitizes question data for teacher users (no-op)
 * @param {Object|Array} questions - Question data (unchanged)
 * @returns {Object|Array} Original question data
 */
function sanitizeQuestionsForTeachers(questions) {
  // Teachers get full access - no sanitization needed
  return questions;
}

module.exports = {
  sanitizeQuestionObject,
  sanitizeQuestionsForStudents,
  sanitizeQuestionsForTeachers
};
