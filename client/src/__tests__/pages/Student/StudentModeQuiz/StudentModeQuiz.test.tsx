import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import { BaseQuestion, parse } from 'gift-pegjs';
import { QuestionType } from 'src/Types/QuestionType';

const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Option A ~Option B}
    
    ::Sample Question 2:: Sample Question 2 {T}`);

const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
    if (question.type !== "Category")
        question.id = (index + 1).toString();
    const newMockQuestion = question;
    return { question: newMockQuestion as BaseQuestion };
});

const mockSubmitAnswer = jest.fn();
const mockDisconnectWebSocket = jest.fn();

beforeEach(() => {
    // Clear local storage before each test
    localStorage.clear();

    render(
        <MemoryRouter>
            <StudentModeQuiz
                questions={mockQuestions}
                submitAnswer={mockSubmitAnswer}
                disconnectWebSocket={mockDisconnectWebSocket}
            />
        </MemoryRouter>
    );
});

describe('StudentModeQuiz', () => {
    test('renders the initial question', async () => {
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
    });

    test('handles answer submission text', async () => {
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });

        expect(mockSubmitAnswer).toHaveBeenCalledWith('Option A', 1);

        // await waitFor(() => {
        //     expect(localStorage.getItem('Answer1')).toBe(JSON.stringify('Option A'));
        // });
    });

    test.skip('handles shows feedback for an already answered question', async () => {
        // Answer the first question
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        expect(mockSubmitAnswer).toHaveBeenCalledWith('Option A', 1);

        await waitFor(() => {
            expect(localStorage.getItem('Answer1')).toBe(JSON.stringify('Option A'));
        });

        expect(screen.queryByText('Répondre')).not.toBeInTheDocument();

        // Simulate feedback display (e.g., a checkmark or feedback message)
        // This part depends on how feedback is displayed in your component
        // For example, if you display a checkmark, you can check for it:
        expect(screen.getByText('✅')).toBeInTheDocument();

        // Navigate to the next question
        act(() => {
            fireEvent.click(screen.getByText('Question suivante'));
        });
        expect(screen.getByText('Sample Question 2')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();

        // Navigate back to the first question
        act(() => {
            fireEvent.click(screen.getByText('Question précédente'));
        });
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        // Check if feedback is shown again
        expect(screen.getByText('✅')).toBeInTheDocument();
    });

    test('handles quit button click', async () => {
        act(() => {
            fireEvent.click(screen.getByText('Quitter'));
        });

        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });

    test('navigates to the next question', async () => {
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Question suivante'));
        });

        expect(screen.getByText('Sample Question 2')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });
});