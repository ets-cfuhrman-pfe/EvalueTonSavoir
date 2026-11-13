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
        // Clear mocks before each test
        mockSubmitAnswer.mockClear();
        mockDisconnectWebSocket.mockClear();

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

    test('shows waiting page (not question form) when answer is submitted', () => {
        // Initially, question form should be visible
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.queryByTestId('waiting-for-next-question')).not.toBeInTheDocument();

        // Provide a complete submitted answer
        const answersWithSubmission = [{
            answer: ['Option A'],
            roomName: 'TEST_ROOM',
            username: 'testuser',
            idQuestion: 1
        } as AnswerSubmissionToBackendType];

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

        // Question form replaced by waiting page
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
        expect(screen.getByText(/Réponse soumise ! En attente de la question suivante\./)).toBeInTheDocument();
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
    });

    test('handles answer submission', () => {
        // Initially, buttons should be interactive
        const optionA = screen.getByText('Option A');
        let submitButton = screen.getByText('Répondre');

        expect(optionA.closest('button')).not.toBeDisabled();
        expect(submitButton).toBeDisabled(); // disabled until option selected

        // Select an option
        act(() => {
            fireEvent.click(optionA);
        });

        submitButton = screen.getByText('Répondre');
        expect(submitButton).not.toBeDisabled();

        // Submit
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);

        // Question form replaced by waiting page
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
    });

    test('renders without quiz title and total questions', () => {
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

        expect(screen.queryByText('Sample Quiz')).not.toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.queryByText('1/2')).not.toBeInTheDocument();
    });

    test('shows confirmation dialog on disconnect button click', () => {
        const disconnectButton = screen.getByText('Quitter');

        act(() => {
            fireEvent.click(disconnectButton);
        });

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Êtes-vous sûr de vouloir quitter\? Vos réponses seront perdues\./)).toBeInTheDocument();

        expect(mockDisconnectWebSocket).not.toHaveBeenCalled();

        const cancelButton = screen.getByText('Annuler');
        act(() => {
            fireEvent.click(cancelButton);
        });

        expect(mockDisconnectWebSocket).not.toHaveBeenCalled();
    });

    test('calls disconnect when confirmation is accepted', () => {
        const disconnectButton = screen.getByText('Quitter');

        act(() => {
            fireEvent.click(disconnectButton);
        });

        const confirmButton = screen.getByTestId('confirm-btn');
        act(() => {
            fireEvent.click(confirmButton);
        });

        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });

    test('updates when question changes', () => {
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

    test('prevents changing answer after submission: waiting page shown, question form hidden', () => {
        const answersWithSubmission = [{
            answer: ['Option A'],
            roomName: 'TEST_ROOM',
            username: 'testuser',
            idQuestion: 1
        } as AnswerSubmissionToBackendType];

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

        // Question form is entirely gone
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Option B')).not.toBeInTheDocument();
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();

        // Waiting page is shown
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();

        // Verify submitAnswer was NOT called (nothing to click)
        expect(mockSubmitAnswer).not.toHaveBeenCalled();
    });

    test('shows results when quiz is completed', () => {
        const answersWithAllSubmissions = [
            { answer: ['Option A'] } as AnswerSubmissionToBackendType,
            { answer: ['Option B'] } as AnswerSubmissionToBackendType
        ];

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={answersWithAllSubmissions}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2}
                        quizCompleted={true}
                        questions={mockQuestions}
                        studentName="Test Student" />
                </MemoryRouter>
            );
        });

        // Waiting page shown with "Voir les résultats" button
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
        expect(screen.getByText('Voir les résultats')).toBeInTheDocument();
    });

    test('correctly handles state when navigating from unanswered to answered question', () => {
        const answersWithQ1Empty = [
            {} as AnswerSubmissionToBackendType,
            { answer: ['Option B'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 2 } as AnswerSubmissionToBackendType
        ];

        // Q1 unanswered — question form shown
        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={answersWithQ1Empty}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.queryByTestId('waiting-for-next-question')).not.toBeInTheDocument();

        // Navigate to Q2 (answered) — waiting page shown
        const secondQuestion = mockQuestions[1].question as MultipleChoiceQuestion;
        secondQuestion.id = '2';

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: secondQuestion }}
                        answers={answersWithQ1Empty}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
    });

    test('correctly handles state when navigating from answered to unanswered question', () => {
        const answersWithQ1Answered = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            {} as AnswerSubmissionToBackendType
        ];

        // Q1 answered — waiting page shown
        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={answersWithQ1Answered}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();

        // Navigate to Q2 (unanswered) — question form shown
        const secondQuestion = mockQuestions[1].question as MultipleChoiceQuestion;
        secondQuestion.id = '2';

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: secondQuestion }}
                        answers={answersWithQ1Answered}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.queryByTestId('waiting-for-next-question')).not.toBeInTheDocument();
    });

    test('distinguishes between empty initialization objects and real answers', () => {
        const emptyInitializedAnswers = Array(2).fill({} as AnswerSubmissionToBackendType);

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={emptyInitializedAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        // Empty objects treated as unanswered — question form shown
        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.queryByTestId('waiting-for-next-question')).not.toBeInTheDocument();

        // Real answer — waiting page shown
        const answersWithRealSubmission = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            {} as AnswerSubmissionToBackendType
        ];

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={answersWithRealSubmission}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
    });

    test('prevents multiple submissions for the same question', () => {
        const emptyAnswers = Array(2).fill({} as AnswerSubmissionToBackendType);

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={emptyAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2} />
                </MemoryRouter>
            );
        });

        const optionA = screen.getByText('Option A');
        expect(optionA.closest('button')).not.toBeDisabled();

        act(() => {
            fireEvent.click(optionA);
        });

        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);
        expect(mockSubmitAnswer).toHaveBeenCalledTimes(1);

        // Waiting page shown, question form gone
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
        expect(screen.queryByText('Option A')).not.toBeInTheDocument();
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();

        mockSubmitAnswer.mockClear();

        // Nothing to click — submit was not called again
        expect(mockSubmitAnswer).not.toHaveBeenCalled();
    });

    test('maintains consistent state across question navigation with mixed answer states', () => {
        const mixedAnswers = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            {} as AnswerSubmissionToBackendType,
            { answer: ['Option B'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 3 } as AnswerSubmissionToBackendType
        ];

        // Q1 answered — waiting page
        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={mixedAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={3} />
                </MemoryRouter>
            );
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();

        // Q2 unanswered — question form
        const secondQuestion = mockQuestions[1].question as MultipleChoiceQuestion;
        secondQuestion.id = '2';

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: secondQuestion }}
                        answers={mixedAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={3} />
                </MemoryRouter>
            );
        });

        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.queryByTestId('waiting-for-next-question')).not.toBeInTheDocument();

        // Q3 answered — waiting page
        const thirdQuestion = { ...mockQuestion, id: '3' } as MultipleChoiceQuestion;

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: thirdQuestion }}
                        answers={mixedAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={3} />
                </MemoryRouter>
            );
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
    });

    test('correctly identifies quiz completion state', () => {
        const incompleteAnswers = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            {} as AnswerSubmissionToBackendType
        ];

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={incompleteAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2}
                        questions={mockQuestions}
                        studentName="Test Student" />
                </MemoryRouter>
            );
        });

        // Quiz not complete — no "Voir les résultats" button
        expect(screen.queryByText('Voir les résultats')).not.toBeInTheDocument();

        const completeAnswers = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            { answer: ['Option B'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 2 } as AnswerSubmissionToBackendType
        ];

        act(() => {
            rerender(
                <MemoryRouter>
                    <TeacherModeQuizV2
                        questionInfos={{ question: mockQuestion }}
                        answers={completeAnswers}
                        submitAnswer={mockSubmitAnswer}
                        disconnectWebSocket={mockDisconnectWebSocket}
                        quizTitle="Sample Quiz"
                        totalQuestions={2}
                        questions={mockQuestions}
                        studentName="Test Student" />
                </MemoryRouter>
            );
        });

        // Quiz complete — results button in waiting page
        expect(screen.getByText('Voir les résultats')).toBeInTheDocument();
    });

    test('does not show correctness banner or feedback in any state', () => {
        // Before submission
        expect(screen.queryByText('Réponse correcte')).not.toBeInTheDocument();
        expect(screen.queryByText('Réponse incorrecte')).not.toBeInTheDocument();

        // After submission
        const answersWithSubmission = [{
            answer: ['Option A'],
            roomName: 'TEST_ROOM',
            username: 'testuser',
            idQuestion: 1
        } as AnswerSubmissionToBackendType];

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

        expect(screen.queryByText('Réponse correcte')).not.toBeInTheDocument();
        expect(screen.queryByText('Réponse incorrecte')).not.toBeInTheDocument();
    });

    test('waiting page shows correct message text', () => {
        const answersWithSubmission = [{
            answer: ['Option A'],
            roomName: 'TEST_ROOM',
            username: 'testuser',
            idQuestion: 1
        } as AnswerSubmissionToBackendType];

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

        expect(screen.getByTestId('waiting-for-next-question')).toBeInTheDocument();
        expect(screen.getByText('Réponse soumise ! En attente de la question suivante.')).toBeInTheDocument();
        // No results button when quiz is not complete
        expect(screen.queryByText('Voir les résultats')).not.toBeInTheDocument();
    });
});
