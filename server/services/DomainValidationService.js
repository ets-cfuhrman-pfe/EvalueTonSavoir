/**
 * Domain-based Answer Validation Service
 * Works with our domain models instead of raw gift-pegjs objects
 * Uses Strategy pattern for clean separation and extensibility
 */

/**
 * Base validation result structure
 */
class ValidationResult {
  constructor({ isCorrect = false, feedback = null, score = 0 }) {
    this.isCorrect = isCorrect;
    this.feedback = feedback;
    this.score = score;
  }

  static correct(feedback = null, score = 1) {
    return new ValidationResult({ isCorrect: true, feedback, score });
  }

  static incorrect(feedback = null, score = 0) {
    return new ValidationResult({ isCorrect: false, feedback, score });
  }
}

/**
 * Base validator interface
 */
class BaseValidator {
  /**
   * Validates a student answer against a domain question
   * @param {Object} _domainQuestion - Domain question object
   * @param {any} _studentAnswer - Student's submitted answer
   * @returns {ValidationResult} Validation result
   */
  validate(_domainQuestion, _studentAnswer) {
    throw new Error('validate method must be implemented by subclasses');
  }

  /**
   * Normalizes student answer for comparison
   * @param {any} answer - Raw student answer
   * @returns {any} Normalized answer
   */
  normalizeAnswer(answer) {
    return answer;
  }
}

/**
 * True/False question validator
 */
class TrueFalseValidator extends BaseValidator {
  validate(domainQuestion, studentAnswer) {
    const normalizedAnswer = this.normalizeAnswer(studentAnswer);
    const isCorrect = normalizedAnswer === domainQuestion.correctAnswer;
    
    const feedback = isCorrect 
      ? domainQuestion.feedback?.correct 
      : domainQuestion.feedback?.incorrect;
    
    return isCorrect 
      ? ValidationResult.correct(feedback)
      : ValidationResult.incorrect(feedback);
  }

  normalizeAnswer(answer) {
    if (typeof answer === 'boolean') {
      return answer;
    }
    if (typeof answer === 'string') {
      return answer.toLowerCase() === 'true';
    }
    if (Array.isArray(answer) && answer.length > 0) {
      return this.normalizeAnswer(answer[0]);
    }
    return false;
  }
}

/**
 * Multiple Choice question validator
 */
class MultipleChoiceValidator extends BaseValidator {
  validate(domainQuestion, studentAnswer) {
    if (!domainQuestion.options || !Array.isArray(domainQuestion.options)) {
      return ValidationResult.incorrect();
    }

    const studentAnswers = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
    const correctOptions = domainQuestion.options.filter(option => option.isCorrect);

    // Single correct answer case
    if (correctOptions.length === 1) {
      const correctOption = correctOptions[0];
      const isCorrect = studentAnswers.length === 1 && 
                       studentAnswers[0] === correctOption.text;

      return isCorrect 
        ? ValidationResult.correct(correctOption.feedback)
        : ValidationResult.incorrect();
    }

    // Multiple correct answers (future enhancement)
    console.warn('MultipleChoiceValidator: Multiple correct answers not fully implemented');
    return ValidationResult.incorrect();
  }
}

/**
 * Short Answer question validator
 */
class ShortAnswerValidator extends BaseValidator {
  validate(domainQuestion, studentAnswer) {
    if (!domainQuestion.acceptedAnswers || !Array.isArray(domainQuestion.acceptedAnswers)) {
      return ValidationResult.incorrect();
    }

    const normalizedStudentAnswer = this.normalizeAnswer(studentAnswer);

    for (const acceptedAnswer of domainQuestion.acceptedAnswers) {
      const normalizedAccepted = this.normalizeAnswer(acceptedAnswer.text);
      if (normalizedStudentAnswer === normalizedAccepted) {
        return ValidationResult.correct(acceptedAnswer.feedback, acceptedAnswer.weight || 1);
      }
    }

    return ValidationResult.incorrect();
  }

  normalizeAnswer(answer) {
    if (typeof answer !== 'string') return '';
    return answer.toLowerCase().trim();
  }
}

/**
 * Numerical question validator
 */
class NumericalValidator extends BaseValidator {
  validate(domainQuestion, studentAnswer) {
    if (!domainQuestion.acceptedValues || !Array.isArray(domainQuestion.acceptedValues)) {
      return ValidationResult.incorrect();
    }

    const studentNumber = this.normalizeAnswer(studentAnswer);
    if (studentNumber === null) {
      return ValidationResult.incorrect();
    }

    for (const acceptedValue of domainQuestion.acceptedValues) {
      if (this.checkNumericalValue(studentNumber, acceptedValue)) {
        return ValidationResult.correct(acceptedValue.feedback);
      }
    }

    return ValidationResult.incorrect();
  }

  normalizeAnswer(answer) {
    if (typeof answer === 'number') return answer;
    const parsed = parseFloat(answer);
    return isNaN(parsed) ? null : parsed;
  }

  checkNumericalValue(studentValue, spec) {
    const tolerance = 0.001; // Small tolerance for floating point comparison
    
    switch (spec.type) {
      case 'simple':
        return Math.abs(studentValue - spec.number) < tolerance;
      case 'range':
        return Math.abs(studentValue - spec.number) <= spec.range;
      case 'high-low':
        return studentValue >= spec.numberLow && studentValue <= spec.numberHigh;
      default:
        return false;
    }
  }
}

/**
 * Main validation service that coordinates domain-based validation
 */
class DomainValidationService {
  constructor() {
    this.validators = new Map([
      ['TF', new TrueFalseValidator()],
      ['MC', new MultipleChoiceValidator()],
      ['Short', new ShortAnswerValidator()],
      ['Numerical', new NumericalValidator()]
    ]);
  }

  /**
   * Validates a student answer against a domain question
   * @param {Object} domainQuestion - Domain question object
   * @param {any} studentAnswer - Student's submitted answer
   * @returns {ValidationResult} Validation result
   */
  validateAnswer(domainQuestion, studentAnswer) {
    if (!domainQuestion?.type) {
      return ValidationResult.incorrect();
    }

    const validator = this.validators.get(domainQuestion.type);
    if (!validator) {
      console.warn(`DomainValidationService: No validator found for question type: ${domainQuestion.type}`);
      return ValidationResult.incorrect();
    }

    try {
      return validator.validate(domainQuestion, studentAnswer);
    } catch (error) {
      console.error(`DomainValidationService: Validation error:`, error);
      return ValidationResult.incorrect();
    }
  }

  /**
   * Registers a new validator for a question type
   * @param {string} questionType - Question type identifier
   * @param {BaseValidator} validator - Validator instance
   */
  registerValidator(questionType, validator) {
    if (!(validator instanceof BaseValidator)) {
      throw new Error('Validator must extend BaseValidator');
    }
    this.validators.set(questionType, validator);
  }
}

// Create singleton instance
const domainValidationService = new DomainValidationService();

module.exports = {
  ValidationResult,
  BaseValidator,
  TrueFalseValidator,
  MultipleChoiceValidator,
  ShortAnswerValidator,
  NumericalValidator,
  DomainValidationService,
  domainValidationService
};
