/**
 * Domain models for questions - decoupled from gift-pegjs
 * These models represent our application's understanding of questions
 * independent of the gift-pegjs library structure
 */

/**
 * Factory functions for creating domain question objects
 */

/**
 * Creates a base question structure for our domain
 * @param {Object} params - Question parameters
 * @returns {Object} Base question object
 */
function createBaseDomainQuestion({ id, title, text, type, tags = [] }) {
  return {
    id,
    title,
    text,
    type,
    tags,
    isValid() {
      return !!(this.id && this.title && this.text && this.type);
    }
  };
}

/**
 * Creates a Multiple Choice Question domain model
 * @param {Object} params - Question parameters
 * @returns {Object} Multiple choice question object
 */
function createMultipleChoiceDomainQuestion({ id, title, text, type = 'MC', tags = [], options = [] }) {
  const base = createBaseDomainQuestion({ id, title, text, type, tags });
  return {
    ...base,
    options, // Array of option objects
    getCorrectOptions() {
      return this.options.filter(option => option.isCorrect);
    }
  };
}

/**
 * Creates a True/False Question domain model
 * @param {Object} params - Question parameters
 * @returns {Object} True/false question object
 */
function createTrueFalseDomainQuestion({ id, title, text, type = 'TF', tags = [], correctAnswer, feedback = {} }) {
  const base = createBaseDomainQuestion({ id, title, text, type, tags });
  return {
    ...base,
    correctAnswer, // boolean
    feedback, // { correct: string, incorrect: string }
    isAnswerCorrect(studentAnswer) {
      return Boolean(studentAnswer) === this.correctAnswer;
    }
  };
}

/**
 * Creates a Short Answer Question domain model
 * @param {Object} params - Question parameters
 * @returns {Object} Short answer question object
 */
function createShortAnswerDomainQuestion({ id, title, text, type = 'Short', tags = [], acceptedAnswers = [] }) {
  const base = createBaseDomainQuestion({ id, title, text, type, tags });
  return {
    ...base,
    acceptedAnswers, // Array of { text: string, weight: number }
    isAnswerAccepted(studentAnswer) {
      return this.acceptedAnswers.some(accepted => 
        accepted.text.toLowerCase().trim() === String(studentAnswer).toLowerCase().trim()
      );
    }
  };
}

/**
 * Creates a Numerical Question domain model
 * @param {Object} params - Question parameters
 * @returns {Object} Numerical question object
 */
function createNumericalDomainQuestion({ id, title, text, type = 'Numerical', tags = [], acceptedValues = [] }) {
  const base = createBaseDomainQuestion({ id, title, text, type, tags });
  return {
    ...base,
    acceptedValues, // Array of numerical answer specs
    isValueAccepted(studentValue) {
      const numValue = parseFloat(studentValue);
      if (isNaN(numValue)) return false;
      return this.acceptedValues.some(accepted => this.checkNumericalValue(numValue, accepted));
    },
    checkNumericalValue(value, spec) {
      // Implementation depends on spec type (simple, range, high-low)
      if (spec.type === 'simple') return Math.abs(value - spec.number) < 0.001;
      if (spec.type === 'range') return Math.abs(value - spec.number) <= spec.range;
      if (spec.type === 'high-low') return value >= spec.numberLow && value <= spec.numberHigh;
      return false;
    }
  };
}

/**
 * Creates an option object for questions
 * @param {Object} params - Option parameters
 * @returns {Object} Option object
 */
function createOptionDomain({ id, text, isCorrect = false, weight = 0, feedback = null }) {
  return {
    id,
    text,
    isCorrect,
    weight,
    feedback,
    toStudentView() {
      return createStudentOptionView({ id: this.id, text: this.text });
    },
    toTeacherView() {
      return createTeacherOptionView({
        id: this.id,
        text: this.text,
        isCorrect: this.isCorrect,
        weight: this.weight,
        feedback: this.feedback
      });
    }
  };
}

/**
 * Creates a student-safe view of a question (no sensitive data)
 * @param {Object} params - View parameters
 * @returns {Object} Student question view
 */
function createStudentQuestionView({ id, title, text, type, options = [] }) {
  return {
    id,
    title,
    text,
    type,
    options // Array of StudentOptionView objects
  };
}

/**
 * Creates a student-safe view of an option (no correctness data)
 * @param {Object} params - View parameters
 * @returns {Object} Student option view
 */
function createStudentOptionView({ id, text }) {
  return {
    id,
    text
  };
}

/**
 * Creates a teacher view of a question (includes all data)
 * @param {Object} params - View parameters
 * @returns {Object} Teacher question view
 */
function createTeacherQuestionView({ id, title, text, type, options = [], correctAnswers = [], feedback = null, points = 1 }) {
  return {
    id,
    title,
    text,
    type,
    options, // Array of TeacherOptionView objects
    correctAnswers,
    feedback,
    points
  };
}

/**
 * Creates a teacher view of an option (includes all data)
 * @param {Object} params - View parameters
 * @returns {Object} Teacher option view
 */
function createTeacherOptionView({ id, text, isCorrect = false, weight = 0, feedback = null }) {
  return {
    id,
    text,
    isCorrect,
    weight,
    feedback
  };
}

module.exports = {
  createBaseDomainQuestion,
  createMultipleChoiceDomainQuestion,
  createTrueFalseDomainQuestion,
  createShortAnswerDomainQuestion,
  createNumericalDomainQuestion,
  createOptionDomain,
  createStudentQuestionView,
  createStudentOptionView,
  createTeacherQuestionView,
  createTeacherOptionView
};
