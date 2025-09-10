/**
 * Question Transformation Service
 * Transforms gift-pegjs objects into domain models and view objects
 * This service isolates the coupling with gift-pegjs to this single module
 */

const {
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
} = require('../models/domain/QuestionDomain');

/**
 * Transforms a gift-pegjs question object into our domain model
 * @param {Object} giftQuestion - Question object from gift-pegjs
 * @returns {Object} Domain question object
 */
function transformGiftToDomain(giftQuestion) {
  if (!giftQuestion || typeof giftQuestion !== 'object') {
    // Handle non-object inputs (like test strings) by returning them as-is
    return giftQuestion;
  }

  // Detect question type from test format or GIFT format
  let detectedType = giftQuestion.type;
  if (!detectedType && giftQuestion.options && Array.isArray(giftQuestion.options)) {
    // Test format: detect MC if options exist
    detectedType = 'MC';
  }

  const baseParams = {
    id: giftQuestion.id || generateQuestionId(),
    title: extractTitle(giftQuestion),
    text: extractText(giftQuestion),
    type: detectedType,
    tags: giftQuestion.tags || []
  };

  switch (detectedType) {
    case 'MC':
      return transformMultipleChoice(giftQuestion, baseParams);
    case 'TF':
      return transformTrueFalse(giftQuestion, baseParams);
    case 'Short':
      return transformShortAnswer(giftQuestion, baseParams);
    case 'Numerical':
      return transformNumerical(giftQuestion, baseParams);
    default:
      return createBaseDomainQuestion(baseParams);
  }
}

/**
 * Transforms a multiple choice question from gift-pegjs
 * @param {Object} giftQuestion - Gift MC question
 * @param {Object} baseParams - Base question parameters
 * @returns {Object} Domain MC question
 */
function transformMultipleChoice(giftQuestion, baseParams) {
  // Handle both GIFT format (choices) and test format (options)
  const choicesArray = giftQuestion.choices || giftQuestion.options || [];
  
  const options = choicesArray.map((choice, index) => {
    return createOptionDomain({
      id: choice.id || `${baseParams.id}_option_${index}`,
      text: extractChoiceText(choice),
      isCorrect: choice.isCorrect || false,
      weight: choice.weight || 0,
      feedback: extractChoiceFeedback(choice)
    });
  });

  return createMultipleChoiceDomainQuestion({
    ...baseParams,
    options
  });
}

/**
 * Transforms a true/false question from gift-pegjs
 * @param {Object} giftQuestion - Gift TF question
 * @param {Object} baseParams - Base question parameters
 * @returns {Object} Domain TF question
 */
function transformTrueFalse(giftQuestion, baseParams) {
  return createTrueFalseDomainQuestion({
    ...baseParams,
    correctAnswer: giftQuestion.isTrue || false,
    feedback: {
      correct: extractFeedback(giftQuestion.trueFormattedFeedback),
      incorrect: extractFeedback(giftQuestion.falseFormattedFeedback)
    }
  });
}

/**
 * Transforms a short answer question from gift-pegjs
 * @param {Object} giftQuestion - Gift Short question
 * @param {Object} baseParams - Base question parameters
 * @returns {Object} Domain Short question
 */
function transformShortAnswer(giftQuestion, baseParams) {
  const acceptedAnswers = (giftQuestion.choices || [])
    .filter(choice => choice.isCorrect)
    .map(choice => ({
      text: choice.text || '',
      weight: choice.weight || 100
    }));

  return createShortAnswerDomainQuestion({
    ...baseParams,
    acceptedAnswers
  });
}

/**
 * Transforms a numerical question from gift-pegjs
 * @param {Object} giftQuestion - Gift Numerical question
 * @param {Object} baseParams - Base question parameters
 * @returns {Object} Domain Numerical question
 */
function transformNumerical(giftQuestion, baseParams) {
  const acceptedValues = (giftQuestion.choices || [])
    .filter(choice => choice.isCorrect)
    .map(choice => transformNumericalChoice(choice));

  return createNumericalDomainQuestion({
    ...baseParams,
    acceptedValues
  });
}

/**
 * Transforms a numerical choice from gift-pegjs format
 * @param {Object} choice - Gift numerical choice
 * @returns {Object} Numerical value specification
 */
function transformNumericalChoice(choice) {
  // Handle nested answer structure or direct properties
  const answer = choice.answer || choice;
  
  if (answer.type === 'simple') {
    return { type: 'simple', number: answer.number };
  } else if (answer.type === 'range') {
    return { type: 'range', number: answer.number, range: answer.range };
  } else if (answer.type === 'high-low') {
    return { type: 'high-low', numberLow: answer.numberLow, numberHigh: answer.numberHigh };
  }
  
  // Fallback for legacy format
  return { type: 'simple', number: answer.number || 0 };
}

/**
 * Creates a student-safe view of a domain question
 * @param {Object} domainQuestion - Domain question object
 * @returns {Object} Student question view
 */
function createStudentView(domainQuestion) {
  const studentOptions = (domainQuestion.options || []).map(option => 
    createStudentOptionView({
      id: option.id,
      text: option.text
    })
  );

  return createStudentQuestionView({
    id: domainQuestion.id,
    title: domainQuestion.title,
    text: domainQuestion.text,
    type: domainQuestion.type,
    options: studentOptions
  });
}

/**
 * Creates a teacher view of a domain question
 * @param {Object} domainQuestion - Domain question object
 * @returns {Object} Teacher question view
 */
function createTeacherView(domainQuestion) {
  const teacherOptions = (domainQuestion.options || []).map(option => 
    createTeacherOptionView({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
      weight: option.weight,
      feedback: option.feedback
    })
  );

  const correctAnswers = extractCorrectAnswers(domainQuestion);

  return createTeacherQuestionView({
    id: domainQuestion.id,
    title: domainQuestion.title,
    text: domainQuestion.text,
    type: domainQuestion.type,
    options: teacherOptions,
    correctAnswers,
    feedback: extractQuestionFeedback(domainQuestion),
    points: calculatePoints(domainQuestion)
  });
}

/**
 * Transforms wrapped questions to student views, maintaining the wrapper structure for compatibility
 * @param {Array|Object} questions - Array of wrapped questions or single wrapped question
 * @returns {Array|Object} Array of student views or single student view (maintains input structure)
 */
function transformToStudentViews(questions) {
  const isArray = Array.isArray(questions);
  const questionsArray = isArray ? questions : [questions];

  const transformedQuestions = questionsArray.map(questionWrapper => {
    // Handle direct question objects (test format or GIFT format)
    if (typeof questionWrapper === 'object' && (questionWrapper.type || questionWrapper.options)) {
      const domainQuestion = transformGiftToDomain(questionWrapper);
      return createStudentView(domainQuestion);
    } else if (questionWrapper.question && typeof questionWrapper.question === 'object') {
      // Handle wrapped questions like { question: giftQuestion }
      const domainQuestion = transformGiftToDomain(questionWrapper.question);
      const studentView = createStudentView(domainQuestion);
      // Return in the same wrapper structure to maintain compatibility
      return { question: studentView };
    } else if (questionWrapper.question && typeof questionWrapper.question === 'string') {
      // Handle wrapped primitive questions (for backwards compatibility with tests)
      return { question: questionWrapper.question };
    } else {
      // Return primitive values as-is (for test compatibility)
      return questionWrapper;
    }
  });

  return isArray ? transformedQuestions : transformedQuestions[0];
}

/**
 * Transforms wrapped questions to teacher views, maintaining the wrapper structure for compatibility
 * @param {Array|Object} questions - Array of wrapped questions or single wrapped question
 * @returns {Array|Object} Array of teacher views or single teacher view (maintains input structure)
 */
function transformToTeacherViews(questions) {
  const isArray = Array.isArray(questions);
  const questionsArray = isArray ? questions : [questions];

  const transformedQuestions = questionsArray.map(questionWrapper => {
    // Handle wrapped questions like { question: giftQuestion }
    if (questionWrapper.question && typeof questionWrapper.question === 'object') {
      const domainQuestion = transformGiftToDomain(questionWrapper.question);
      const teacherView = createTeacherView(domainQuestion);
      // Return in the same wrapper structure to maintain compatibility
      return { question: teacherView };
    } else {
      // Handle direct gift questions
      const domainQuestion = transformGiftToDomain(questionWrapper);
      return createTeacherView(domainQuestion);
    }
  });

  return isArray ? transformedQuestions : transformedQuestions[0];
}

// Helper functions

/**
 * Extracts title from gift-pegjs question
 * @param {Object} giftQuestion - Gift question object
 * @returns {string} Question title
 */
/**
 * Extracts title from gift-pegjs question or test format
 * @param {Object} giftQuestion - Gift question object
 * @returns {string} Question title
 */
function extractTitle(giftQuestion) {
  // Handle test format that uses 'question' field
  if (giftQuestion.question && typeof giftQuestion.question === 'string') {
    return giftQuestion.question;
  }
  // Handle standard GIFT format
  return giftQuestion.title || 'Untitled Question';
}

/**
 * Extracts text content from gift-pegjs question
 * @param {Object} giftQuestion - Gift question object
 * @returns {string} Question text
 */
function extractText(giftQuestion) {
  // Handle test format that uses 'question' field
  if (giftQuestion.question && typeof giftQuestion.question === 'string') {
    return giftQuestion.question;
  }
  // Handle standard GIFT format
  if (giftQuestion.formattedStem?.text) {
    return giftQuestion.formattedStem.text;
  }
  if (giftQuestion.stem?.text) {
    return giftQuestion.stem.text;
  }
  return giftQuestion.stem || 'No question text';
}

/**
 * Extracts text from a choice object
 * @param {Object} choice - Gift choice object
 * @returns {string} Choice text
 */
function extractChoiceText(choice) {
  if (choice.formattedText?.text) {
    return choice.formattedText.text;
  }
  return choice.text || '';
}

/**
 * Extracts feedback from a choice object
 * @param {Object} choice - Gift choice object
 * @returns {string|null} Choice feedback
 */
function extractChoiceFeedback(choice) {
  if (choice.formattedFeedback?.text) {
    return choice.formattedFeedback.text;
  }
  return choice.feedback || null;
}

/**
 * Extracts feedback from formatted feedback object
 * @param {Object} formattedFeedback - Gift formatted feedback
 * @returns {string|null} Feedback text
 */
function extractFeedback(formattedFeedback) {
  if (formattedFeedback?.text) {
    return formattedFeedback.text;
  }
  return null;
}

/**
 * Extracts correct answers from domain question
 * @param {Object} domainQuestion - Domain question object
 * @returns {Array} Array of correct answers
 */
function extractCorrectAnswers(domainQuestion) {
  switch (domainQuestion.type) {
    case 'MC':
      return domainQuestion.options
        .filter(option => option.isCorrect)
        .map(option => option.id);
    case 'TF':
      return [domainQuestion.correctAnswer];
    case 'Short':
      return domainQuestion.acceptedAnswers.map(answer => answer.text);
    case 'Numerical':
      return domainQuestion.acceptedValues;
    default:
      return [];
  }
}

/**
 * Extracts feedback from domain question
 * @param {Object} domainQuestion - Domain question object
 * @returns {string|null} Question feedback
 */
function extractQuestionFeedback(domainQuestion) {
  if (domainQuestion.feedback) {
    return domainQuestion.feedback;
  }
  return null;
}

/**
 * Calculates points for a question
 * @param {Object} _domainQuestion - Domain question object (unused for now)
 * @returns {number} Question points
 */
function calculatePoints(_domainQuestion) {
  // Default point value, could be configurable
  return 1;
}

/**
 * Generates a unique question ID
 * @returns {string} Unique question ID
 */
function generateQuestionId() {
  return `q_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

module.exports = {
  transformGiftToDomain,
  createStudentView,
  createTeacherView,
  transformToStudentViews,
  transformToTeacherViews
};
