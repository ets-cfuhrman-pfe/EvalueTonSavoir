import React from 'react';
import { QuizContext } from 'src/pages/Student/JoinRoom/QuizContext';
import { parse, MultipleChoiceQuestion, TrueFalseQuestion, ShortAnswerQuestion, NumericalQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

const mockSubmitAnswer = jest.fn();

const sampleTrueFalseQuestion = parse(`Sample True False Question{T}`)[0] as TrueFalseQuestion;
const sampleShortAnswerQuestion = parse('::Sample Short Answer Question:: What is 2 + 2? {=4 ~3 ~5}')[0] as ShortAnswerQuestion;
const sampleMultipleChoiceQuestions = parse(
    `::Sample Question 1:: Question stem
    {
        =Choice 1
        ~Choice 2
    }
    
    ::Sample Question 2:: Question stem
    {
        =Choice 1
        =Choice 2
        ~Choice 3
    }
    `
) as MultipleChoiceQuestion[];

const sampleNumericalQuestion = parse(
    `::Sample Numerical Question:: What is the range of 5 to 10?
    {
        #5..10
    }`
)[0] as NumericalQuestion;

export const mockContextValue = {
    questions: [
        { question: sampleTrueFalseQuestion },
        { question: sampleShortAnswerQuestion },
        { question: sampleMultipleChoiceQuestions[0] },
        { question: sampleMultipleChoiceQuestions[1] },
        { question: sampleNumericalQuestion },
    ],
    index: 0,
    submitAnswer: mockSubmitAnswer,
    answers: [] as AnswerType[],
    showAnswer: false,
    isTeacherMode: false,
    setShowAnswer: jest.fn(),
    setQuestions: jest.fn(),
    setAnswers: jest.fn(),
    updateIndex: jest.fn(),
    setIsTeacherMode: jest.fn(),
    setDisconnectWebSocket: jest.fn(),
    disconnectWebSocket: jest.fn(),
    setShowScore: jest.fn(),
    showScore: false,
    setScore: jest.fn(),
    score: 0,
    setTimer: jest.fn(),
    timer: 0,
    isQuestionSent: false,
    setisTeacherMode: jest.fn(),
    setIsQuestionSent: jest.fn(),
    roomName: 'TestRoom',
    setRoomName: jest.fn(),
    isRoomActive: false,
    setIsRoomActive: jest.fn(),
    username: 'TestUser',
    setUsername: jest.fn(),
};

export const TestQuizContextProvider: React.FC<{
    children: React.ReactNode;
    contextOverrides?: Partial<typeof mockContextValue>;
}> = ({ children, contextOverrides = {} }) => {
    // Merge the default mockContextValue with the overrides
    const mergedContextValue = { ...mockContextValue, ...contextOverrides };

    return <QuizContext.Provider value={mergedContextValue}>{children}</QuizContext.Provider>;
};