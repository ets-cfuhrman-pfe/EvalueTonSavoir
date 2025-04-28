import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parse, ShortAnswerQuestion } from 'gift-pegjs';
import ShortAnswerQuestionDisplay from 'src/components/QuestionsDisplay/ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

describe('ShortAnswerQuestion Component with QuizContext', () => {
    const shortAnswerQuestion = parse(
        '::Sample Short Answer Question:: What is 2 + 2? {=4 ~3 ~5}'
    )[0] as ShortAnswerQuestion;

    const renderWithContext = (overrides = {}) => {
        return render(
            <TestQuizContextProvider
                contextOverrides={{
                    questions: [{ question: shortAnswerQuestion }], // Override questions array
                    index: 0, // Ensure index points to the correct question
                    ...overrides,
                }}
            >
                <ShortAnswerQuestionDisplay />
            </TestQuizContextProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        renderWithContext();
        expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
        expect(inputElement).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input change correctly', () => {
        renderWithContext();
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '4' } });

        expect(inputElement.value).toBe('4');
    });

    it('Submit button should be disabled if nothing is entered', () => {
        renderWithContext();
        const submitButton = screen.getByText('Répondre');

        expect(submitButton).toBeDisabled();
    });

    it('does not submit answer if nothing is entered', () => {
        renderWithContext();
        const submitButton = screen.getByText('Répondre');

        fireEvent.click(submitButton);

        expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it.skip('submits answer correctly', () => {
        renderWithContext();
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
        const submitButton = screen.getByText('Répondre');

        fireEvent.change(inputElement, { target: { value: '4' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('4')).toBeInTheDocument();
    });
});