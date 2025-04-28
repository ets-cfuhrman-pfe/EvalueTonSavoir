import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import { parse, TrueFalseQuestion, MultipleChoiceQuestion } from 'gift-pegjs';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Option A =Option B ~Option C}
    
    ::Sample Question 2:: Sample Question 2 {T}`
);

const mockQuestions = [
    { question: mockGiftQuestions[0] as MultipleChoiceQuestion },
    { question: mockGiftQuestions[1] as TrueFalseQuestion },
];

const mockSubmitAnswer = jest.fn();
const mockDisconnectWebSocket = jest.fn();

const renderWithContext = (overrides = {}) => {
    return render(
        <TestQuizContextProvider
            contextOverrides={{
                questions: mockQuestions,
                answers: Array(mockQuestions.length).fill({ answer: undefined }),
                submitAnswer: mockSubmitAnswer,
                disconnectWebSocket: mockDisconnectWebSocket,
                index: 0,
                ...overrides,
            }}
        >
            <MemoryRouter>
                <StudentModeQuiz />
            </MemoryRouter>
        </TestQuizContextProvider>
    );
};

describe('StudentModeQuiz', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders the initial question', async () => {
        renderWithContext();
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
    });

    test('handles answer submission', async () => {
        renderWithContext();
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });

        expect(mockSubmitAnswer).toHaveBeenCalled();
    });

    test('handles quit button click', async () => {
        renderWithContext();
        act(() => {
            fireEvent.click(screen.getByText('Quitter'));
        });

        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });

    test.skip('navigates to the next question', async () => {
        renderWithContext();
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