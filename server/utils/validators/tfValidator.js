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
  console.log(`tfValidator: Validating TF question. Question:`, question);
  console.log(`tfValidator: Student answer:`, studentAnswer, `(type: ${typeof studentAnswer})`);
  console.log(`tfValidator: Correct answer (isTrue):`, question.isTrue);
  
  if (!question) {
    return { isCorrect: false, feedback: null };
  }

  const correctAnswer = question.isTrue;
  
  // Handle different answer formats
  let studentBool;
  if (typeof studentAnswer === 'boolean') {
    studentBool = studentAnswer;
  } else if (typeof studentAnswer === 'string') {
    studentBool = studentAnswer.toLowerCase() === 'true';
  } else if (Array.isArray(studentAnswer) && studentAnswer.length > 0) {
    // Handle array format [true] or [false]
    const firstAnswer = studentAnswer[0];
    if (typeof firstAnswer === 'boolean') {
      studentBool = firstAnswer;
    } else if (typeof firstAnswer === 'string') {
      studentBool = firstAnswer.toLowerCase() === 'true';
    } else {
      studentBool = false;
    }
  } else {
    studentBool = false;
  }

  console.log(`tfValidator: Converted student answer:`, studentBool);
  console.log(`tfValidator: Comparison: ${studentBool} === ${correctAnswer} = ${studentBool === correctAnswer}`);

  const isCorrect = studentBool === correctAnswer;

  return {
    isCorrect,
    feedback: isCorrect ? question.trueFormattedFeedback : question.falseFormattedFeedback
  };
}

module.exports = {
  validateTrueFalseAnswer
};
