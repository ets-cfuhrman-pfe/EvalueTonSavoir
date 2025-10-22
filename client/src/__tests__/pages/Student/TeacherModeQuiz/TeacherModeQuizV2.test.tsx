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
                    roomName="TESTROOM"
                    totalQuestions={2} />
            </MemoryRouter>
        );
        rerender = utils.rerender;
    });

    test('renders the initial question with V2 features', () => {
        expect(screen.getByText('TESTROOM: Sample Quiz')).toBeInTheDocument();
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

        // Simulate an answer being submitted by providing a COMPLETE answer in the answers array
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

        // Now the waiting message should not have invisible class
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
    });

    test('handles answer submission', () => {
        // Verify initial state - should be able to interact with options
        const optionA = screen.getByText('Option A');
        const optionB = screen.getByText('Option B');
        let submitButton = screen.getByText('Répondre');
        
        // Buttons should not be disabled initially
        expect(optionA.closest('button')).not.toBeDisabled();
        expect(optionB.closest('button')).not.toBeDisabled();
        expect(submitButton).toBeDisabled(); // Should be disabled until option is selected

        // Click on an option to select it
        act(() => {
            fireEvent.click(optionA);
        });

        // Find the submit button again after state change
        submitButton = screen.getByText('Répondre');
        
        // Now submit button should be enabled
        expect(submitButton).not.toBeDisabled();

        // Click the submit button
        act(() => {
            fireEvent.click(submitButton);
        });

        // Check that submitAnswer was called with the correct arguments
        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);

        // Check that the waiting message is now visible (after state update)
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
        
        // Verify that after submission, the option buttons are now disabled (hideAnswerFeedback behavior)
        expect(optionA.closest('button')).toBeDisabled();
        expect(optionB.closest('button')).toBeDisabled();
        
        // Verify that the submit button is no longer visible (hidden after submission in teacher mode rhythm)
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
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

    test('shows confirmation dialog on disconnect button click', () => {
        const disconnectButton = screen.getByText('Quitter');
        
        // Click the disconnect button - should show confirmation dialog
        act(() => {
            fireEvent.click(disconnectButton);
        });
        
        // Dialog should appear with confirmation message (askConfirm is true when quiz is not completed)
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Êtes-vous sûr de vouloir quitter\? Vos réponses seront perdues\./)).toBeInTheDocument();
        
        // Disconnect should not be called yet (dialog is shown)
        expect(mockDisconnectWebSocket).not.toHaveBeenCalled();
        
        // Click the cancel button to dismiss the dialog
        const cancelButton = screen.getByText('Annuler');
        act(() => {
            fireEvent.click(cancelButton);
        });
        
        // Dialog should be closed and disconnect should still not be called
        expect(mockDisconnectWebSocket).not.toHaveBeenCalled();
    });

    test('calls disconnect when confirmation is accepted', () => {
        const disconnectButton = screen.getByText('Quitter');
        
        // Click the disconnect button
        act(() => {
            fireEvent.click(disconnectButton);
        });
        
        // Confirm the disconnect action
        const confirmButton = screen.getByTestId('modal-confirm-button');
        act(() => {
            fireEvent.click(confirmButton);
        });
        
        // Now disconnect should be called
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

    test('prevents changing answer after submission', () => {
        // Start with a submitted answer in the answers array
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

        // Verify the option buttons are disabled (hideAnswerFeedback behavior)
        const optionA = screen.getByText('Option A');
        const optionB = screen.getByText('Option B');
        
        expect(optionA.closest('button')).toBeDisabled();
        expect(optionB.closest('button')).toBeDisabled();

        // Verify the submit button is no longer available
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();

        // Verify waiting message is visible
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');

        // Try to click on a different option (should not work because button is disabled)
        act(() => {
            fireEvent.click(optionB);
        });

        // Verify submitAnswer was NOT called
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

        // When quiz is completed, button should show "Voir les résultats"
        expect(screen.getByText('Voir les résultats')).toBeInTheDocument();
    });

    // State management tests for navigation between questions
    test('correctly handles state when navigating from unanswered to answered question', () => {
        // Start with question 1 unanswered (empty object in answers array)
        const answersWithQ1Empty = [
            {} as AnswerSubmissionToBackendType,  // Question 1 - empty object (not answered)
            { answer: ['Option B'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 2 } as AnswerSubmissionToBackendType // Question 2 - answered
        ];

        // Initially render question 1 (unanswered)
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

        // Should show answer button for unanswered question
        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).toHaveClass('invisible');

        // Navigate to question 2 (answered)
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

        // Should show waiting message for answered question
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
    });

    test('correctly handles state when navigating from answered to unanswered question', () => {
        // Start with question 1 answered, question 2 empty
        const answersWithQ1Answered = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType, // Question 1 - answered
            {} as AnswerSubmissionToBackendType  // Question 2 - empty object (not answered)
        ];

        // Start with question 1 (answered)
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

        // Should show waiting message for answered question
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');

        // Navigate to question 2 (unanswered)
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

        // Should show answer button for unanswered question
        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).toHaveClass('invisible');
    });

    test('distinguishes between empty initialization objects and real answers', () => {
        // Test with array initialized with empty objects (as it happens in the real app)
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

        // Should treat empty objects as unanswered
        expect(screen.getByText('Répondre')).toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).toHaveClass('invisible');

        // Now test with a real answer object
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

        // Should now show waiting message for answered question
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
    });

    test('prevents multiple submissions for the same question', () => {
        // Start with unanswered question
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

        // Initially, buttons should be enabled
        const optionA = screen.getByText('Option A');
        const optionB = screen.getByText('Option B');
        expect(optionA.closest('button')).not.toBeDisabled();
        expect(optionB.closest('button')).not.toBeDisabled();

        // Click on an option and submit
        act(() => {
            fireEvent.click(optionA);
        });

        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        // Verify first submission
        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);
        expect(mockSubmitAnswer).toHaveBeenCalledTimes(1);

        // Component should immediately update state to prevent further submissions
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
        
        // After submission, buttons should be disabled
        expect(optionA.closest('button')).toBeDisabled();
        expect(optionB.closest('button')).toBeDisabled();
        
        // Submit button should be hidden after submission in teacher mode rhythm
        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();

        mockSubmitAnswer.mockClear();

        // Try to click on another option (this should not trigger another submission because button is disabled)
        act(() => {
            fireEvent.click(optionB);
        });

        // Should not have called submit again
        expect(mockSubmitAnswer).not.toHaveBeenCalled();
    });

    test('maintains consistent state across question navigation with mixed answer states', () => {
        // Create answers array with mixed states: answered, empty, answered
        const mixedAnswers = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType, // Q1 answered
            {} as AnswerSubmissionToBackendType, // Q2 empty (unanswered)
            { answer: ['Option B'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 3 } as AnswerSubmissionToBackendType  // Q3 answered
        ];

        // Test Q1 (answered)
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
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');

        // Navigate to Q2 (unanswered)
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
        expect(screen.getByText('En attente pour la prochaine question...')).toHaveClass('invisible');

        // Navigate to Q3 (answered) - create a third question
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
        expect(screen.getByText('En attente pour la prochaine question...')).not.toHaveClass('invisible');
    });

    test('correctly identifies quiz completion state', () => {
        // Test with incomplete answers (one empty object)
        const incompleteAnswers = [
            { answer: ['Option A'], roomName: 'TEST_ROOM', username: 'testuser', idQuestion: 1 } as AnswerSubmissionToBackendType,
            {} as AnswerSubmissionToBackendType // This empty object should prevent quiz from being considered complete
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

        // Should not show results button since quiz is not complete
        expect(screen.queryByText('Voir les résultats')).not.toBeInTheDocument();

        // Test with all questions answered
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

        // Should show results button since all questions are answered
        expect(screen.getByText('Voir les résultats')).toBeInTheDocument();
    });
});