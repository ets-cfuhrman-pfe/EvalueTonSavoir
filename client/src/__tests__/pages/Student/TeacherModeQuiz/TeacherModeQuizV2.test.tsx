//TeacherModeQuizV2.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { BaseQuestion, MultipleChoiceQuestion, parse } from 'gift-pegjs';
import TeacherModeQuizV2 from 'src/components/TeacherModeQuiz/TeacherModeQuizV2';
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

describe('TeacherModeQuizV2', () => {

    let mockQuestion = mockQuestions[0].question as  MultipleChoiceQuestion;
    mockQuestion.id = '1';

    const mockSubmitAnswer = jest.fn();
    const mockDisconnectWebSocket = jest.fn();

    let rerender: (ui: React.ReactElement) => void;

    beforeEach(async () => {
        const utils = render(
            <MemoryRouter>
                <TeacherModeQuizV2
                    questionInfos={{ question: mockQuestion }}
                    answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                    submitAnswer={mockSubmitAnswer}
                    disconnectWebSocket={mockDisconnectWebSocket}
                    quizTitle="Sample Quiz"
                    totalQuestions={2} />
            </MemoryRouter>
        );
        rerender = utils.rerender;
    });

    test('renders the initial question with V2 features', () => {
        expect(screen.getByText('Sample Quiz')).toBeInTheDocument();
        expect(screen.getByText('1/2')).toBeInTheDocument();
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
    });

    test('displays waiting message when answer is submitted', () => {
        // Initially, the waiting message should have invisible class
        const waitingMessage = screen.getByText('En attente pour la prochaine question...');
        expect(waitingMessage).toHaveClass('invisible');

        // Simulate an answer being submitted by providing an answer in the answers array
        const answersWithSubmission = [{ answer: ['Option A'] } as AnswerSubmissionToBackendType];

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={answersWithSubmission}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        // Now the waiting message should not have invisible class
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
    });

    test('handles answer submission', () => {
        // Click on an option to select it
        const optionA = screen.getByText('Option A');
        act(() => {
            fireEvent.click(optionA);
        });

        // Click the submit button
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        // Check that submitAnswer was called with the correct arguments
        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);

        // Check that the waiting message is now visible
        expect(screen.getByText('En attente pour la prochaine question...')).toBeVisible();
    });

    test('renders without quiz title and total questions', () => {
        // Rerender if quizTitle and totalQuestions props are not provided
        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket} />
                </MemoryRouter>
            );
        });

        // Should not show quiz title
        expect(screen.queryByText('Sample Quiz')).not.toBeInTheDocument();
        // Should show question number without total
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    });

    test('handles disconnect button click', () => {
        const disconnectButton = screen.getByText('Quitter');
        act(() => {
            fireEvent.click(disconnectButton);
        });
        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });

    test('updates when question changes', () => {
        // Change to second question
        const secondQuestion = mockQuestions[1].question as MultipleChoiceQuestion;
        secondQuestion.id = '2';

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: secondQuestion }}
                        answers={Array(mockQuestions.length).fill({} as AnswerSubmissionToBackendType)}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.getByText('2/2')).toBeInTheDocument();
        expect(screen.getByText('Sample Question 2')).toBeInTheDocument();
    });
});