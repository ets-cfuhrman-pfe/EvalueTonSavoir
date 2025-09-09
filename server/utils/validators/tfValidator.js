/**
 * True/False question validation
 */

/**
 * Validates true/false question answers
 * @param {Object} question - TF question object
 * @param {boolean|string} studentAnswer - Student's answer (true/false or "true"/"false")
 * @returns {Object} Validation result with isCorrect and feedback
 */
function validateTrueFalseAnswer(question, studentAnswer) {
  if (!question) {
    return { isCorrect: false, feedback: null };
  }

  const correctAnswer = question.isTrue;
  const studentBool = typeof studentAnswer === 'boolean' ? studentAnswer :
                     typeof studentAnswer === 'string' ? studentAnswer.toLowerCase() === 'true' : false;

  const isCorrect = studentBool === correctAnswer;

  return {
    isCorrect,
    feedback: isCorrect ? question.trueFormattedFeedback : question.falseFormattedFeedback
  };
}

module.exports = {
  validateTrueFalseAnswer
};
