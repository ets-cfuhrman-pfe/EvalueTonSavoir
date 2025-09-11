/**
 * Tests for Domain-based Validation Service
 */

const {
  ValidationResult,
  TrueFalseValidator,
  MultipleChoiceValidator,
  ShortAnswerValidator,
  NumericalValidator,
  domainValidationService
} = require('../../services/DomainValidationService');

const { validateAnswer } = require('../../services/ValidationBridge');

describe('DomainValidationService', () => {
  describe('ValidationResult', () => {
    it('should create correct result', () => {
      const result = ValidationResult.correct('Good job!', 1);
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Good job!');
      expect(result.score).toBe(1);
    });

    it('should create incorrect result', () => {
      const result = ValidationResult.incorrect('Try again');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Try again');
      expect(result.score).toBe(0);
    });
  });

  describe('TrueFalseValidator', () => {
    const validator = new TrueFalseValidator();
    const trueDomainQuestion = {
      type: 'TF',
      correctAnswer: true,
      feedback: { correct: 'Correct!', incorrect: 'Wrong!' }
    };

    it('should validate correct true answer', () => {
      const result = validator.validate(trueDomainQuestion, true);
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct!');
    });

    it('should validate incorrect false answer', () => {
      const result = validator.validate(trueDomainQuestion, false);
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe('Wrong!');
    });

    it('should handle string answers', () => {
      const result = validator.validate(trueDomainQuestion, 'true');
      expect(result.isCorrect).toBe(true);
    });

    it('should handle array answers', () => {
      const result = validator.validate(trueDomainQuestion, [true]);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('MultipleChoiceValidator', () => {
    const validator = new MultipleChoiceValidator();
    const mcDomainQuestion = {
      type: 'MC',
      options: [
        { id: 'opt1', text: 'Paris', isCorrect: true, feedback: 'Correct!' },
        { id: 'opt2', text: 'London', isCorrect: false },
        { id: 'opt3', text: 'Berlin', isCorrect: false }
      ]
    };

    it('should validate correct answer', () => {
      const result = validator.validate(mcDomainQuestion, 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct!');
    });

    it('should validate incorrect answer', () => {
      const result = validator.validate(mcDomainQuestion, 'London');
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('ShortAnswerValidator', () => {
    const validator = new ShortAnswerValidator();
    const shortDomainQuestion = {
      type: 'Short',
      acceptedAnswers: [
        { text: 'Paris', weight: 100, feedback: 'Correct!' },
        { text: 'paris', weight: 100, feedback: 'Correct!' }
      ]
    };

    it('should validate correct answer (case insensitive)', () => {
      const result = validator.validate(shortDomainQuestion, 'PARIS');
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct!');
    });

    it('should validate incorrect answer', () => {
      const result = validator.validate(shortDomainQuestion, 'London');
      expect(result.isCorrect).toBe(false);
    });

    it('should handle whitespace', () => {
      const result = validator.validate(shortDomainQuestion, '  Paris  ');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('NumericalValidator', () => {
    const validator = new NumericalValidator();
    const numericalDomainQuestion = {
      type: 'Numerical',
      acceptedValues: [
        { type: 'simple', number: 42 },
        { type: 'range', number: 10, range: 2 },
        { type: 'high-low', numberLow: 20, numberHigh: 30 }
      ]
    };

    it('should validate simple exact answer', () => {
      const result = validator.validate(numericalDomainQuestion, 42);
      expect(result.isCorrect).toBe(true);
    });

    it('should validate range answer', () => {
      const result = validator.validate(numericalDomainQuestion, 11);
      expect(result.isCorrect).toBe(true);
    });

    it('should validate high-low range answer', () => {
      const result = validator.validate(numericalDomainQuestion, 25);
      expect(result.isCorrect).toBe(true);
    });

    it('should reject out of range answer', () => {
      const result = validator.validate(numericalDomainQuestion, 50);
      expect(result.isCorrect).toBe(false);
    });

    it('should handle string numbers', () => {
      const result = validator.validate(numericalDomainQuestion, '42');
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('DomainValidationService Integration', () => {
    it('should route to correct validator', () => {
      const tfQuestion = {
        type: 'TF',
        correctAnswer: true,
        feedback: { correct: 'Yes!' }
      };

      const result = domainValidationService.validateAnswer(tfQuestion, true);
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Yes!');
    });

    it('should handle unknown question types', () => {
      const unknownQuestion = {
        type: 'Unknown',
        correctAnswer: 'test'
      };

      const result = domainValidationService.validateAnswer(unknownQuestion, 'test');
      expect(result.isCorrect).toBe(false);
    });
  });
});

describe('ValidationBridge', () => {
  describe('Legacy compatibility', () => {
    it('should work with gift-pegjs TF questions', () => {
      const giftQuestion = {
        type: 'TF',
        isTrue: true,
        trueFormattedFeedback: { text: 'Correct!' },
        falseFormattedFeedback: { text: 'Wrong!' }
      };

      const result = validateAnswer(giftQuestion, true);
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct!');
    });

    it('should work with gift-pegjs MC questions', () => {
      const giftQuestion = {
        type: 'MC',
        choices: [
          {
            isCorrect: true,
            formattedText: { text: 'Paris' },
            formattedFeedback: { text: 'Correct!' }
          },
          {
            isCorrect: false,
            formattedText: { text: 'London' }
          }
        ]
      };

      const result = validateAnswer(giftQuestion, 'Paris');
      expect(result.isCorrect).toBe(true);
      expect(result.feedback).toBe('Correct!');
    });

    it('should handle validation errors gracefully', () => {
      const result = validateAnswer(null, 'answer');
      expect(result.isCorrect).toBe(false);
      expect(result.feedback).toBe(null);
    });
  });
});
