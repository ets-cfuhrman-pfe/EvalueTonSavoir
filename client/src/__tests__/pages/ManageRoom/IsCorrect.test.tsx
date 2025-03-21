import { checkIfIsCorrect } from 'src/pages/Teacher/ManageRoom/useRooms';
import { HighLowNumericalAnswer, MultipleChoiceQuestion, MultipleNumericalAnswer, NumericalQuestion, RangeNumericalAnswer, ShortAnswerQuestion, SimpleNumericalAnswer, TrueFalseQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { QuestionType } from 'src/Types/QuestionType';

describe('checkIfIsCorrect', () => {
    const mockQuestions: QuestionType[] = [
        {
            question: {
                id: '1',
                type: 'MC',
                choices: [
                    { isCorrect: true, formattedText: { text: 'Answer1' } },
                    { isCorrect: true, formattedText: { text: 'Answer2' } },
                    { isCorrect: false, formattedText: { text: 'Answer3' } },
                ],
            } as MultipleChoiceQuestion,
        },
    ];

    test('returns true when all selected answers are correct', () => {
        const answer: AnswerType = ['Answer1', 'Answer2'];
        const result = checkIfIsCorrect(answer, 1, mockQuestions);
        expect(result).toBe(true);
    });

    test('returns false when some selected answers are incorrect', () => {
        const answer: AnswerType = ['Answer1', 'Answer3'];
        const result = checkIfIsCorrect(answer, 1, mockQuestions);
        expect(result).toBe(false);
    });

    test('returns false when no answers are selected', () => {
        const answer: AnswerType = [];
        const result = checkIfIsCorrect(answer, 1, mockQuestions);
        expect(result).toBe(false);
    });

    test('returns false when no correct answers are provided in the question', () => {
        const mockQuestionsWithNoCorrectAnswers: QuestionType[] = [
            {
                question: {
                    id: '1',
                    type: 'MC',
                    choices: [
                        { isCorrect: false, formattedText: { text: 'Answer1' } },
                        { isCorrect: false, formattedText: { text: 'Answer2' } },
                    ],
                } as MultipleChoiceQuestion,
            },
        ];
        const answer: AnswerType = ['Answer1'];
        const result = checkIfIsCorrect(answer, 1, mockQuestionsWithNoCorrectAnswers);
        expect(result).toBe(false);
    });

    test('returns true for a correct true/false answer', () => {
        const mockQuestionsTF: QuestionType[] = [
            {
                question: {
                    id: '2',
                    type: 'TF',
                    isTrue: true,
                } as TrueFalseQuestion,
            },
        ];
        const answer: AnswerType = [true];
        const result = checkIfIsCorrect(answer, 2, mockQuestionsTF);
        expect(result).toBe(true);
    });

    test('returns false for an incorrect true/false answer', () => {
        const mockQuestionsTF: QuestionType[] = [
            {
                question: {
                    id: '2',
                    type: 'TF',
                    isTrue: true,
                } as TrueFalseQuestion,
            },
        ];
        const answer: AnswerType = [false];
        const result = checkIfIsCorrect(answer, 2, mockQuestionsTF);
        expect(result).toBe(false);
    });

    test('returns false for a true/false question with no answer', () => {
        const mockQuestionsTF: QuestionType[] = [
            {
                question: {
                    id: '2',
                    type: 'TF',
                    isTrue: true,
                } as TrueFalseQuestion,
            },
        ];
        const answer: AnswerType = [];
        const result = checkIfIsCorrect(answer, 2, mockQuestionsTF);
        expect(result).toBe(false);
    });

    test('returns true for a correct true/false answer when isTrue is false', () => {
        const mockQuestionsTF: QuestionType[] = [
            {
                question: {
                    id: '3',
                    type: 'TF',
                    isTrue: false, // Correct answer is false
                } as TrueFalseQuestion,
            },
        ];
        const answer: AnswerType = [false];
        const result = checkIfIsCorrect(answer, 3, mockQuestionsTF);
        expect(result).toBe(true);
    });

    test('returns false for an incorrect true/false answer when isTrue is false', () => {
        const mockQuestionsTF: QuestionType[] = [
            {
                question: {
                    id: '3',
                    type: 'TF',
                    isTrue: false, // Correct answer is false
                } as TrueFalseQuestion,
            },
        ];
        const answer: AnswerType = [true];
        const result = checkIfIsCorrect(answer, 3, mockQuestionsTF);
        expect(result).toBe(false);
    });

    test('returns true for a correct short answer', () => {
        const mockQuestionsShort: QuestionType[] = [
            {
                question: {
                    id: '4',
                    type: 'Short',
                    choices: [
                        { text: 'CorrectAnswer1' },
                        { text: 'CorrectAnswer2' },
                    ],
                } as ShortAnswerQuestion,
            },
        ];
        const answer: AnswerType = ['CorrectAnswer1'];
        const result = checkIfIsCorrect(answer, 4, mockQuestionsShort);
        expect(result).toBe(true);
    });
    
    test('returns false for an incorrect short answer', () => {
        const mockQuestionsShort: QuestionType[] = [
            {
                question: {
                    id: '4',
                    type: 'Short',
                    choices: [
                        { text: 'CorrectAnswer1' },
                        { text: 'CorrectAnswer2' },
                    ],
                } as ShortAnswerQuestion,
            },
        ];
        const answer: AnswerType = ['WrongAnswer'];
        const result = checkIfIsCorrect(answer, 4, mockQuestionsShort);
        expect(result).toBe(false);
    });
    
    test('returns true for a correct short answer with case insensitivity', () => {
        const mockQuestionsShort: QuestionType[] = [
            {
                question: {
                    id: '4',
                    type: 'Short',
                    choices: [
                        { text: 'CorrectAnswer1' },
                        { text: 'CorrectAnswer2' },
                    ],
                } as ShortAnswerQuestion,
            },
        ];
        const answer: AnswerType = ['correctanswer1']; // Lowercase version of the correct answer
        const result = checkIfIsCorrect(answer, 4, mockQuestionsShort);
        expect(result).toBe(true);
    });
    
    test('returns false for a short answer question with no answer', () => {
        const mockQuestionsShort: QuestionType[] = [
            {
                question: {
                    id: '4',
                    type: 'Short',
                    choices: [
                        { text: 'CorrectAnswer1' },
                        { text: 'CorrectAnswer2' },
                    ],
                } as ShortAnswerQuestion,
            },
        ];
        const answer: AnswerType = [];
        const result = checkIfIsCorrect(answer, 4, mockQuestionsShort);
        expect(result).toBe(false);
    });


    test('returns true for a correct simple numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '5',
                    type: 'Numerical',
                    choices: [
                        { type: 'simple', number: 42 } as SimpleNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [42]; // User's answer
        const result = checkIfIsCorrect(answer, 5, mockQuestionsNumerical);
        expect(result).toBe(true);
    });
    
    test('returns false for an incorrect simple numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '5',
                    type: 'Numerical',
                    choices: [
                        { type: 'simple', number: 42 } as SimpleNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [43]; // User's answer
        const result = checkIfIsCorrect(answer, 5, mockQuestionsNumerical);
        expect(result).toBe(false);
    });
    
    test('returns true for a correct range numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '6',
                    type: 'Numerical',
                    choices: [
                        { type: 'range', number: 50, range: 5 } as RangeNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [52]; // User's answer within the range (50 ± 5)
        const result = checkIfIsCorrect(answer, 6, mockQuestionsNumerical);
        expect(result).toBe(true);
    });
    
    test('returns false for an out-of-range numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '6',
                    type: 'Numerical',
                    choices: [
                        { type: 'range', number: 50, range: 5 } as RangeNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [56]; // User's answer outside the range (50 ± 5)
        const result = checkIfIsCorrect(answer, 6, mockQuestionsNumerical);
        expect(result).toBe(false);
    });
    
    test('returns true for a correct high-low numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '7',
                    type: 'Numerical',
                    choices: [
                        { type: 'high-low', numberHigh: 100, numberLow: 90 } as HighLowNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [95]; // User's answer within the range (90 to 100)
        const result = checkIfIsCorrect(answer, 7, mockQuestionsNumerical);
        expect(result).toBe(true);
    });
    
    test('returns false for an out-of-range high-low numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '7',
                    type: 'Numerical',
                    choices: [
                        { type: 'high-low', numberHigh: 100, numberLow: 90 } as HighLowNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [105]; // User's answer outside the range (90 to 100)
        const result = checkIfIsCorrect(answer, 7, mockQuestionsNumerical);
        expect(result).toBe(false);
    });
    
    test('returns true for a correct multiple numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '8',
                    type: 'Numerical',
                    choices: [
                        {
                            isCorrect: true,
                            answer: { type: 'simple', number: 42 } as SimpleNumericalAnswer,
                        } as MultipleNumericalAnswer,
                        {
                            isCorrect: false,
                            answer: { type: 'high-low', numberHigh: 100, numberLow: 90 } as HighLowNumericalAnswer,
                            formattedFeedback: { text: 'You guessed way too high' },
                        }
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [42]; // User's answer matches the correct multiple numerical answer
        const result = checkIfIsCorrect(answer, 8, mockQuestionsNumerical);
        expect(result).toBe(true);
    });
    
    test('returns false for an incorrect multiple numerical answer', () => {
        const mockQuestionsNumerical: QuestionType[] = [
            {
                question: {
                    id: '8',
                    type: 'Numerical',
                    choices: [
                        {
                            type: 'multiple',
                            isCorrect: true,
                            answer: { type: 'simple', number: 42 } as SimpleNumericalAnswer,
                        } as MultipleNumericalAnswer,
                    ],
                } as NumericalQuestion,
            },
        ];
        const answer: AnswerType = [43]; // User's answer does not match the correct multiple numerical answer
        const result = checkIfIsCorrect(answer, 8, mockQuestionsNumerical);
        expect(result).toBe(false);
    });

});
