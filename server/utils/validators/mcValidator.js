/**
 * Multiple choice question validation
 */

/**
 * Validates multiple choice question answers
 * @param {Object} question - MC question object
 * @param {string|Array} studentAnswer - Student's answer(s)
 * @returns {Object} Validation result with isCorrect and feedback
 */
function validateMultipleChoiceAnswer(question, studentAnswer) {
  if (!question.choices || !Array.isArray(question.choices)) {
    return { isCorrect: false, feedback: null };
  }

  const correctChoices = question.choices.filter(choice => choice.isCorrect);
  const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];

  // For single correct answer MC questions
  if (correctChoices.length === 1) {
    const correctText = correctChoices[0].formattedText?.text || correctChoices[0].text;
    const isCorrect = studentAnswers.length === 1 && studentAnswers[0] === correctText;

    const correctChoice = correctChoices[0];
    return {
      isCorrect,
      feedback: isCorrect ? correctChoice.formattedFeedback : null
    };
  }

  // For multiple correct answers (not implemented yet)
  console.warn('validateMultipleChoiceAnswer: Multiple correct answers not fully implemented');
  return { isCorrect: false, feedback: null };
}

module.exports = {
  validateMultipleChoiceAnswer
};
