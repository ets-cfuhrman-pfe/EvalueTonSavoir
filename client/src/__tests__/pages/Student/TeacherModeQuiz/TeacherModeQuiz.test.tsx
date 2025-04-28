import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import '@testing-library/jest-dom';
import { parse, MultipleChoiceQuestion } from 'gift-pegjs';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import { MemoryRouter } from 'react-router-dom';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Option A ~Option B}
    
    ::Sample Question 2:: Sample Question 2 {=Option A ~Option B}`
);

const mockQuestions = [
    { question: mockGiftQuestions[0] as MultipleChoiceQuestion },
    { question: mockGiftQuestions[1] as MultipleChoiceQuestion },
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
                <TeacherModeQuiz />
            </MemoryRouter>
        </TestQuizContextProvider>
    );
};

describe('TeacherModeQuiz', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders the initial question', () => {
        renderWithContext();
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Sample Question 1')).toBeInTheDocument();
        expect(screen.getByText('Option A')).toBeInTheDocument();
        expect(screen.getByText('Option B')).toBeInTheDocument();
        expect(screen.getByText('Quitter')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles answer submission and displays feedback', () => {
        renderWithContext();
        act(() => {
            fireEvent.click(screen.getByText('Option A'));
        });
        act(() => {
            fireEvent.click(screen.getByText('Répondre'));
        });
        expect(mockSubmitAnswer).toHaveBeenCalled();
    });

    test('handles shows feedback for an already answered question', () => {
        renderWithContext({
            answers: [{ answer: ['Option A'] }, { answer: undefined }],
            showAnswer: true,
        });

        // // Answer the first question
        // act(() => {
        //     fireEvent.click(screen.getAllByText('Option A')[0]);
        // });
        // act(() => {
        //     fireEvent.click(screen.getByText('Répondre'));
        // });
        // expect(mockSubmitAnswer).toHaveBeenCalledWith(['Option A'], 1);

        // // Navigate to the next question
        // act(() => {
        //     fireEvent.click(screen.getByText('Question suivante'));
        // });
        // expect(screen.getByText('Sample Question 2')).toBeInTheDocument();

        // // Navigate back to the first question
        // act(() => {
        //     fireEvent.click(screen.getByText('Question précédente'));
        // });
        // expect(screen.getByText('Sample Question 1')).toBeInTheDocument();

        // Check if the feedback dialog is shown again
        expect(screen.getByText('Rétroaction')).toBeInTheDocument();
    });

    test('handles disconnect button click', () => {
        renderWithContext();
        act(() => {
            fireEvent.click(screen.getByText('Quitter'));
        });
        expect(mockDisconnectWebSocket).toHaveBeenCalled();
    });
});