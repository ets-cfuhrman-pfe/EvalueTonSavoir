/**
 * Tests for Question Transformation Service
 */

const {
  transformGiftToDomain,
  createStudentView,
  createTeacherView,
  transformToStudentViews,
  transformToTeacherViews
} = require('../../services/QuestionTransformationService');

describe('QuestionTransformationService', () => {
  describe('transformGiftToDomain', () => {
    it('should transform a multiple choice question', () => {
      const giftQuestion = {
        type: 'MC',
        id: 'test-mc',
        title: 'Test MC Question',
        formattedStem: { text: 'What is the capital of France?' },
        choices: [
          {
            isCorrect: true,
            weight: 100,
            formattedText: { text: 'Paris' },
            formattedFeedback: { text: 'Correct!' }
          },
          {
            isCorrect: false,
            weight: 0,
            formattedText: { text: 'London' },
            formattedFeedback: { text: 'Incorrect' }
          }
        ]
      };

      const domainQuestion = transformGiftToDomain(giftQuestion);

      expect(domainQuestion.id).toBe('test-mc');
      expect(domainQuestion.title).toBe('Test MC Question');
      expect(domainQuestion.text).toBe('What is the capital of France?');
      expect(domainQuestion.type).toBe('MC');
      expect(domainQuestion.options).toHaveLength(2);
      expect(domainQuestion.options[0].isCorrect).toBe(true);
      expect(domainQuestion.options[1].isCorrect).toBe(false);
    });

    it('should transform a true/false question', () => {
      const giftQuestion = {
        type: 'TF',
        id: 'test-tf',
        title: 'Test TF Question',
        formattedStem: { text: 'Paris is the capital of France.' },
        isTrue: true,
        trueFormattedFeedback: { text: 'Correct answer!' },
        falseFormattedFeedback: { text: 'Wrong answer!' }
      };

      const domainQuestion = transformGiftToDomain(giftQuestion);

      expect(domainQuestion.id).toBe('test-tf');
      expect(domainQuestion.type).toBe('TF');
      expect(domainQuestion.correctAnswer).toBe(true);
      expect(domainQuestion.feedback.correct).toBe('Correct answer!');
      expect(domainQuestion.feedback.incorrect).toBe('Wrong answer!');
    });
  });

  describe('createStudentView', () => {
    it('should create student-safe view without sensitive data', () => {
      const domainQuestion = {
        id: 'test-q',
        title: 'Test Question',
        text: 'What is 2+2?',
        type: 'MC',
        options: [
          {
            id: 'opt1',
            text: '4',
            isCorrect: true,
            weight: 100,
            feedback: 'Correct!'
          },
          {
            id: 'opt2',
            text: '5',
            isCorrect: false,
            weight: 0,
            feedback: 'Wrong'
          }
        ]
      };

      const studentView = createStudentView(domainQuestion);

      expect(studentView.id).toBe('test-q');
      expect(studentView.title).toBe('Test Question');
      expect(studentView.text).toBe('What is 2+2?');
      expect(studentView.type).toBe('MC');
      expect(studentView.options).toHaveLength(2);
      
      // Student view should not contain sensitive data
      expect(studentView.options[0]).toEqual({ id: 'opt1', text: '4' });
      expect(studentView.options[1]).toEqual({ id: 'opt2', text: '5' });
      expect(studentView.options[0].isCorrect).toBeUndefined();
      expect(studentView.options[0].weight).toBeUndefined();
      expect(studentView.options[0].feedback).toBeUndefined();
    });
  });

  describe('createTeacherView', () => {
    it('should create teacher view with all data', () => {
      const domainQuestion = {
        id: 'test-q',
        title: 'Test Question',
        text: 'What is 2+2?',
        type: 'MC',
        options: [
          {
            id: 'opt1',
            text: '4',
            isCorrect: true,
            weight: 100,
            feedback: 'Correct!'
          },
          {
            id: 'opt2',
            text: '5',
            isCorrect: false,
            weight: 0,
            feedback: 'Wrong'
          }
        ]
      };

      const teacherView = createTeacherView(domainQuestion);

      expect(teacherView.id).toBe('test-q');
      expect(teacherView.title).toBe('Test Question');
      expect(teacherView.text).toBe('What is 2+2?');
      expect(teacherView.type).toBe('MC');
      expect(teacherView.options).toHaveLength(2);
      expect(teacherView.correctAnswers).toEqual(['opt1']);
      expect(teacherView.points).toBe(1);
      
      // Teacher view should contain all data
      expect(teacherView.options[0]).toEqual({
        id: 'opt1',
        text: '4',
        isCorrect: true,
        weight: 100,
        feedback: 'Correct!'
      });
    });
  });

  describe('transformToStudentViews', () => {
    it('should handle wrapped questions from socket', () => {
      const wrappedQuestions = [
        {
          question: {
            type: 'MC',
            id: 'test-mc',
            title: 'Test Question',
            formattedStem: { text: 'What is 2+2?' },
            choices: [
              {
                isCorrect: true,
                weight: 100,
                formattedText: { text: '4' }
              },
              {
                isCorrect: false,
                weight: 0,
                formattedText: { text: '5' }
              }
            ]
          }
        }
      ];

      const studentViews = transformToStudentViews(wrappedQuestions);

      expect(studentViews).toHaveLength(1);
      expect(studentViews[0].question.id).toBe('test-mc');
      expect(studentViews[0].question.options).toHaveLength(2);
      expect(studentViews[0].question.options[0].isCorrect).toBeUndefined();
    });

    it('should handle single wrapped question from socket', () => {
      const wrappedQuestion = {
        question: {
          type: 'TF',
          id: 'test-tf',
          title: 'Test TF',
          formattedStem: { text: 'True or false?' },
          isTrue: true
        }
      };

      const studentViews = transformToStudentViews(wrappedQuestion);

      expect(studentViews.question.id).toBe('test-tf');
      expect(studentViews.question.type).toBe('TF');
    });
  });

  describe('transformToTeacherViews', () => {
    it('should handle wrapped questions for teachers', () => {
      const wrappedQuestions = [
        {
          question: {
            type: 'MC',
            id: 'teacher-test',
            title: 'Teacher Test',
            formattedStem: { text: 'What is the answer?' },
            choices: [
              {
                isCorrect: true,
                weight: 100,
                formattedText: { text: 'Correct' },
                formattedFeedback: { text: 'Good job!' }
              }
            ]
          }
        }
      ];

      const teacherViews = transformToTeacherViews(wrappedQuestions);

      expect(teacherViews).toHaveLength(1);
      expect(teacherViews[0].question.id).toBe('teacher-test');
      expect(teacherViews[0].question.options[0].isCorrect).toBe(true);
      expect(teacherViews[0].question.options[0].weight).toBe(100);
      expect(teacherViews[0].question.options[0].feedback).toBe('Good job!');
    });
  });

  describe('Security - Data Isolation', () => {
    it('should not leak sensitive data to student views', () => {
      const sensitiveQuestion = {
        question: {
          type: 'MC',
          id: 'security-test',
          title: 'Security Test',
          formattedStem: { text: 'Which is correct?' },
          choices: [
            {
              isCorrect: true,
              weight: 100,
              formattedText: { text: 'Correct Answer' },
              formattedFeedback: { text: 'This is the right answer!' }
            },
            {
              isCorrect: false,
              weight: -50,
              formattedText: { text: 'Wrong Answer' },
              formattedFeedback: { text: 'This is wrong!' }
            }
          ]
        }
      };

      const studentView = transformToStudentViews([sensitiveQuestion])[0];
      const studentViewJson = JSON.stringify(studentView);

      // Ensure no sensitive data is present in the serialized student view
      expect(studentViewJson).not.toContain('isCorrect');
      expect(studentViewJson).not.toContain('weight');
      expect(studentViewJson).not.toContain('feedback');
      expect(studentViewJson).not.toContain('formattedFeedback');
      expect(studentViewJson).not.toContain('This is the right answer');
      expect(studentViewJson).not.toContain('This is wrong');
      
      // But should contain the question text and options
      expect(studentViewJson).toContain('Which is correct?');
      expect(studentViewJson).toContain('Correct Answer');
      expect(studentViewJson).toContain('Wrong Answer');
    });
  });
});
