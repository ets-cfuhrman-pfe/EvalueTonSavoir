import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NumericalQuestion, parse, ParsedGIFTQuestion } from 'gift-pegjs';
import NumericalQuestionDisplay from 'src/components/QuestionsDisplay/NumericalQuestionDisplay/NumericalQuestionDisplay';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

const questions = parse(
    `
    ::Sample Question 1:: Question stem
    {
        #5..10
    }`
) as ParsedGIFTQuestion[];

const question = questions[0] as NumericalQuestion;

describe('NumericalQuestion parse', () => {
    const q = questions[0];

    it('The question is Numerical', () => {
        expect(q.type).toBe('Numerical');
    });
});

describe('NumericalQuestion Component with QuizContext', () => {
    const renderWithContext = (overrides = {}) => {
        return render(
            <TestQuizContextProvider
                contextOverrides={{
                    questions: [{ question }], // Provide the NumericalQuestion
                    index: 0, // Ensure index points to the correct question
                    ...overrides,
                }}
            >
                <NumericalQuestionDisplay />
            </TestQuizContextProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        renderWithContext();
        expect(screen.getByText(question.formattedStem.text)).toBeInTheDocument();
        expect(screen.getByTestId('number-input')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input change correctly', () => {
        renderWithContext();
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '7' } });

        expect(inputElement.value).toBe('7');
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

        expect(screen.queryByText('7')).not.toBeInTheDocument();
    });

    it.skip('submits answer correctly', () => {
        renderWithContext();
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;
        const submitButton = screen.getByText('Répondre');

        fireEvent.change(inputElement, { target: { value: '7' } });
        fireEvent.click(submitButton);

        expect(screen.getByText('7')).toBeInTheDocument();
    });
});