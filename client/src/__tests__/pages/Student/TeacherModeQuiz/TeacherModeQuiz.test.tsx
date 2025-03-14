//TeacherModeQuiz.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { BaseQuestion, MultipleChoiceQuestion, parse } from 'gift-pegjs';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import { MemoryRouter } from 'react-router-dom';
import { QuestionType } from 'src/Types/QuestionType';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';

const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Option A ~Option B}
    
    ::Sample Question 2:: Sample Question 2 {=Option A ~Option B}`);

    const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
        if (question.type !== "Category")
            question.id = (index + 1).toString();
        const newMockQuestion = question;
        return {question : newMockQuestion as BaseQuestion};
    });

describe('TeacherModeQuiz', () => {  

    
    let mockQuestion = mockQuestions[0].question as  MultipleChoiceQuestion;
    mockQuestion.id = '1';

    const mockSubmitAnswer = jest.fn();
    const mockDisconnectWebSocket = jest.fn();

    let rerender: (ui: React.ReactElement) => void;

    beforeEach(async () => {
        const utils = render(
            <MemoryRouter>
                <TeacherModeQuiz
                    questionInfos={{ question: mockQuestion }}
                    answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                    submitAnswer={mockSubmitAnswer}
                    disconnectWebSocket={mockDisconnectWebSocket} />
            </MemoryRouter>
        );
        rerender = utils.rerender;
    });

    test('renders the initial question', () => {

        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles answer submission and displays feedback', () => {

        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith('Option A', 1);
    });


    test('handles shows feedback for answered question', () => {
            act(() => {
                fireEvent.click(screen.getByText('Option B'));
            });
            act(() => {
                fireEvent.click(screen.getByText('Répondre'));
            });
            expect(mockSubmitAnswer).toHaveBeenCalledWith('Option B', 1)
            expect(screen.getByText('❌ Incorrect!')).toBeInTheDocument();
    });

    test('handles shows feedback for an already answered question', () => {
        // Answer the first question
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith('Option A', 1);
        mockQuestion = mockQuestions[1].question as MultipleChoiceQuestion;
        // Navigate to the next question by re-rendering with new props
        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuiz
                        questionInfos={{ question: mockQuestion }}
                        answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                    />
                </MemoryRouter>
            );
        });

        mockQuestion = mockQuestions[0].question as MultipleChoiceQuestion;

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuiz
                        questionInfos={{ question: mockQuestion }}
                        answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                    />
                </MemoryRouter>
            );
        });

        // Check if the feedback dialog is shown again
        expect(screen.getByText('❌ Incorrect!')).toBeInTheDocument();
    });
    
    test('handles disconnect button click', () => {
        act(() => {
            fireEvent.click(screen.getByText('Quitter'));
        });
        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });
});
