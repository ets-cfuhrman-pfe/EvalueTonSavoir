/**
 * Main answer validation orchestrator
 * Routes validation to appropriate validator based on question type
 */

const { validateTrueFalseAnswer } = require('./tfValidator');
const { validateMultipleChoiceAnswer } = require('./mcValidator');
const { validateNumericalAnswer } = require('./numericalValidator');
const { validateShortAnswer } = require('./shortValidator');

/**
 * Validates a student's answer against the correct answer for a question
 * @param {Object} question - The original question object with correct answers
 * @param {any} studentAnswer - The student's submitted answer
 * @returns {Object} Validation result with isCorrect and feedback
 */
function validateAnswer(question, studentAnswer) {
  if (!question) {
    return { isCorrect: false, feedback: null };
  }

  switch (question.type) {
    case 'TF':
      return validateTrueFalseAnswer(question, studentAnswer);
    case 'MC':
      return validateMultipleChoiceAnswer(question, studentAnswer);
    case 'Numerical':
      return validateNumericalAnswer(question, studentAnswer);
    case 'Short':
      return validateShortAnswer(question, studentAnswer);
    default:
      console.warn(`validateAnswer: Unknown question type: ${question.type}`);
      return { isCorrect: false, feedback: null };
  }
}

module.exports = {
  validateAnswer
};
