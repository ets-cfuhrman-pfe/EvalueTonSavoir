/**
 * Numerical question validation
 */

/**
 * Validates numerical question answers
 * @param {Object} question - Numerical question object
 * @param {number|string} studentAnswer - Student's numerical answer
 * @returns {Object} Validation result with isCorrect and feedback
 */
function validateNumericalAnswer(question, studentAnswer) {
  if (!question.choices || !Array.isArray(question.choices)) {
    return { isCorrect: false, feedback: null };
  }

  const studentNum = parseStudentAnswer(studentAnswer);
  if (studentNum === null) {
    return { isCorrect: false, feedback: null };
  }

  for (const choice of question.choices) {
    if (!choice.isCorrect) continue;

    const result = checkChoiceMatch(choice, studentNum);
    if (result.isCorrect) {
      return result;
    }
  }

  return { isCorrect: false, feedback: null };
}

/**
 * Parses student answer to number
 * @param {number|string} studentAnswer - Raw student answer
 * @returns {number|null} Parsed number or null if invalid
 */
function parseStudentAnswer(studentAnswer) {
  if (typeof studentAnswer === 'number') return studentAnswer;

  const parsed = parseFloat(studentAnswer);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Checks if a choice matches the student's numerical answer
 * @param {Object} choice - Choice object to check
 * @param {number} studentNum - Student's numerical answer
 * @returns {Object} Validation result
 */
function checkChoiceMatch(choice, studentNum) {
  if (choice.answer) {
    return checkNestedAnswer(choice.answer, studentNum, choice);
  } else {
    return checkLegacyAnswer(choice, studentNum);
  }
}

/**
 * Checks nested answer structure
 * @param {Object} answer - Nested answer object
 * @param {number} studentNum - Student's answer
 * @param {Object} choice - Choice object for feedback
 * @returns {Object} Validation result
 */
function checkNestedAnswer(answer, studentNum, choice) {
  let isCorrect = false;

  if (answer.type === 'simple' && answer.number !== undefined) {
    isCorrect = studentNum === answer.number;
  } else if (answer.type === 'range' && answer.number !== undefined && answer.range !== undefined) {
    isCorrect = studentNum >= (answer.number - answer.range) &&
               studentNum <= (answer.number + answer.range);
  } else if (answer.type === 'high-low' && answer.numberLow !== undefined && answer.numberHigh !== undefined) {
    isCorrect = studentNum >= answer.numberLow && studentNum <= answer.numberHigh;
  }

  return {
    isCorrect,
    feedback: isCorrect ? choice.formattedFeedback : null
  };
}

/**
 * Checks legacy answer structure
 * @param {Object} choice - Choice object with direct properties
 * @param {number} studentNum - Student's answer
 * @returns {Object} Validation result
 */
function checkLegacyAnswer(choice, studentNum) {
  let isCorrect = false;

  if (choice.type === 'simple' && choice.number !== undefined) {
    isCorrect = studentNum === choice.number;
  } else if (choice.type === 'range' && choice.number !== undefined && choice.range !== undefined) {
    isCorrect = studentNum >= (choice.number - choice.range) &&
               studentNum <= (choice.number + choice.range);
  } else if (choice.type === 'high-low' && choice.numberLow !== undefined && choice.numberHigh !== undefined) {
    isCorrect = studentNum >= choice.numberLow && studentNum <= choice.numberHigh;
  }

  return {
    isCorrect,
    feedback: isCorrect ? choice.formattedFeedback : null
  };
}

module.exports = {
  validateNumericalAnswer
};
