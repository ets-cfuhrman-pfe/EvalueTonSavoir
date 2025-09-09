/**
 * Short answer question validation
 */

/**
 * Validates short answer question answers
 * @param {Object} question - Short answer question object
 * @param {string} studentAnswer - Student's text answer
 * @returns {Object} Validation result with isCorrect and feedback
 */
function validateShortAnswer(question, studentAnswer) {
  if (!question.choices || !Array.isArray(question.choices)) {
    return { isCorrect: false, feedback: null };
  }

  const studentText = normalizeAnswer(studentAnswer);

  for (const choice of question.choices) {
    if (!choice.isCorrect) continue;

    const correctText = normalizeAnswer(choice.text);
    if (studentText === correctText) {
      return {
        isCorrect: true,
        feedback: choice.formattedFeedback
      };
    }
  }

  return { isCorrect: false, feedback: null };
}

/**
 * Normalizes answer text for comparison
 * @param {string} answer - Answer text to normalize
 * @returns {string} Normalized answer text
 */
function normalizeAnswer(answer) {
  if (typeof answer !== 'string') return '';
  return answer.toLowerCase().trim();
}

module.exports = {
  validateShortAnswer
};
