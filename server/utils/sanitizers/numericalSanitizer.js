/**
 * Numerical question sanitization utilities
 */

const { SENSITIVE_FIELDS } = require('./sanitizerConfig');

/**
 * Sanitizes a numerical choice by removing sensitive answer values
 * @param {Object} choice - The choice object to sanitize
 * @returns {Object} Sanitized choice object
 */
function sanitizeNumericalChoice(choice) {
  if (!choice || typeof choice !== 'object') return choice;

  let sanitizedChoice = { ...choice };

  // Remove common sensitive fields
  SENSITIVE_FIELDS.choiceFields.forEach(field => {
    delete sanitizedChoice[field];
  });

  // Handle nested answer structure
  if (sanitizedChoice.answer && typeof sanitizedChoice.answer === 'object') {
    sanitizedChoice.answer = sanitizeNumericalAnswer(sanitizedChoice.answer);
  } else {
    // Handle direct properties on choice (legacy format)
    sanitizedChoice = sanitizeNumericalAnswer(sanitizedChoice);
  }

  return sanitizedChoice;
}

/**
 * Removes sensitive numerical values from an answer object
 * @param {Object} answer - The answer object to sanitize
 * @returns {Object} Sanitized answer object
 */
function sanitizeNumericalAnswer(answer) {
  if (!answer || typeof answer !== 'object') return answer;

  const sanitizedAnswer = { ...answer };

  if (answer.type === 'simple' && 'number' in answer) {
    delete sanitizedAnswer.number;
  } else if (answer.type === 'range' && 'number' in answer) {
    delete sanitizedAnswer.number;
    delete sanitizedAnswer.range;
  } else if (answer.type === 'high-low' && 'numberLow' in answer) {
    delete sanitizedAnswer.numberLow;
    delete sanitizedAnswer.numberHigh;
  }

  return sanitizedAnswer;
}

module.exports = {
  sanitizeNumericalChoice,
  sanitizeNumericalAnswer
};
