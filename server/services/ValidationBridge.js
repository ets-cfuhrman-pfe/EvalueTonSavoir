/**
 * Validation Bridge Service
 * Connects the new domain-based validation with the existing socket infrastructure
 * Handles the transformation from gift-pegjs to domain models for validation
 */

const { transformGiftToDomain } = require('./QuestionTransformationService');
const { domainValidationService } = require('./DomainValidationService');

/**
 * Legacy-compatible validation function that works with the existing socket code
 * Transforms gift-pegjs questions to domain models and validates using the new service
 * @param {Object} giftQuestion - Original gift-pegjs question object
 * @param {any} studentAnswer - Student's submitted answer
 * @returns {Object} Legacy-compatible validation result
 */
function validateAnswerLegacy(giftQuestion, studentAnswer) {
  try {
    // Transform gift-pegjs question to domain model
    const domainQuestion = transformGiftToDomain(giftQuestion);
    
    // Use new domain validation service
    const validationResult = domainValidationService.validateAnswer(domainQuestion, studentAnswer);
    
    // Convert to legacy format for backward compatibility
    return {
      isCorrect: validationResult.isCorrect,
      feedback: validationResult.feedback,
      score: validationResult.score
    };
  } catch (error) {
    console.error('ValidationBridge: Error during validation:', error);
    return {
      isCorrect: false,
      feedback: null,
      score: 0
    };
  }
}

/**
 * New domain-based validation function
 * @param {Object} domainQuestion - Domain question object
 * @param {any} studentAnswer - Student's submitted answer
 * @returns {ValidationResult} Domain validation result
 */
function validateAnswerDomain(domainQuestion, studentAnswer) {
  return domainValidationService.validateAnswer(domainQuestion, studentAnswer);
}

/**
 * Validates wrapped question objects (handles both { question: ... } and direct questions)
 * @param {Object} questionWrapper - Wrapped question object or direct question
 * @param {any} studentAnswer - Student's submitted answer
 * @returns {Object} Legacy-compatible validation result
 */
function validateWrappedQuestion(questionWrapper, studentAnswer) {
  // Handle wrapped questions like { question: giftQuestion }
  const giftQuestion = questionWrapper.question || questionWrapper;
  return validateAnswerLegacy(giftQuestion, studentAnswer);
}

module.exports = {
  validateAnswerLegacy,
  validateAnswerDomain,
  validateWrappedQuestion,
  // Export legacy name for backward compatibility
  validateAnswer: validateAnswerLegacy
};
