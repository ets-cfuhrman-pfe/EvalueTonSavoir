/**
 * Configuration for data sanitization
 * Defines which fields should be removed from quiz data for different user roles
 */

const SENSITIVE_FIELDS = {
  // Fields that should be removed for all question types
  common: [
    'correctAnswer',
    'explanation',
    'hints',
    'metadata',
    'grading',
    'feedback'
  ],

  // Question type specific sensitive fields
  byType: {
    TF: ['isTrue', 'trueFormattedFeedback', 'falseFormattedFeedback'],
    MC: ['isCorrect', 'formattedFeedback', 'weight'],
    Numerical: ['number', 'range', 'numberLow', 'numberHigh'],
    Short: ['text', 'formattedFeedback', 'weight']
  },

  // Fields that should be removed from options/choices
  choiceFields: [
    'isCorrect',
    'feedback',
    'weight',
    'formattedFeedback'
  ],

  // Numerical answer structure fields to remove
  numericalAnswerFields: {
    simple: ['number'],
    range: ['number', 'range'],
    'high-low': ['numberLow', 'numberHigh']
  }
};

module.exports = {
  SENSITIVE_FIELDS
};
