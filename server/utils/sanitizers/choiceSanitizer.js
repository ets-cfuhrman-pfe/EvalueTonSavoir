/**
 * Choice/option sanitization utilities for quiz questions
 */

const { SENSITIVE_FIELDS } = require('./sanitizerConfig');

/**
 * Sanitizes options array to remove sensitive information
 * @param {Array} options - Array of option objects
 * @param {string} questionType - Type of question (MC, TF, etc.)
 * @returns {Array} Sanitized options array
 */
function sanitizeOptions(options, questionType = 'MC') {
  if (!options || !Array.isArray(options)) return options;

  return options.map(option => sanitizeOption(option, questionType));
}

/**
 * Sanitizes a single option object
 * @param {Object} option - Option object to sanitize
 * @param {string} questionType - Type of question
 * @returns {Object} Sanitized option object
 */
function sanitizeOption(option, questionType = 'MC') {
  if (!option || typeof option !== 'object') return option;

  const sanitizedOption = { ...option };

  // Remove common sensitive fields
  SENSITIVE_FIELDS.choiceFields.forEach(field => {
    delete sanitizedOption[field];
  });

  // Remove question-type specific fields
  if (SENSITIVE_FIELDS.byType[questionType]) {
    SENSITIVE_FIELDS.byType[questionType].forEach(field => {
      delete sanitizedOption[field];
    });
  }

  return sanitizedOption;
}

/**
 * Sanitizes choices array (GIFT format)
 * @param {Array} choices - Array of choice objects
 * @param {string} questionType - Type of question
 * @returns {Array} Sanitized choices array
 */
function sanitizeChoices(choices, questionType = 'MC') {
  if (!choices || !Array.isArray(choices)) return choices;

  return choices.map(choice => sanitizeChoice(choice, questionType));
}

/**
 * Sanitizes a single choice object
 * @param {Object} choice - Choice object to sanitize
 * @param {string} questionType - Type of question
 * @returns {Object} Sanitized choice object
 */
function sanitizeChoice(choice, questionType = 'MC') {
  if (!choice || typeof choice !== 'object') return choice;

  const sanitizedChoice = { ...choice };

  // Remove common sensitive fields
  SENSITIVE_FIELDS.choiceFields.forEach(field => {
    delete sanitizedChoice[field];
  });

  // Remove question-type specific fields
  if (SENSITIVE_FIELDS.byType[questionType]) {
    SENSITIVE_FIELDS.byType[questionType].forEach(field => {
      delete sanitizedChoice[field];
    });
  }

  return sanitizedChoice;
}

module.exports = {
  sanitizeOptions,
  sanitizeOption,
  sanitizeChoices,
  sanitizeChoice
};
