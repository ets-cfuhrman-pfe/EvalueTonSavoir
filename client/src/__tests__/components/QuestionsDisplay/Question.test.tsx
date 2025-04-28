import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parse, TrueFalseQuestion, MultipleChoiceQuestion, NumericalQuestion, ShortAnswerQuestion } from 'gift-pegjs';
import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

describe('Questions Component', () => {
    const sampleTrueFalseQuestion = parse('::Sample True/False Question:: Sample True/False Question {T}')[0] as TrueFalseQuestion;
    const sampleMultipleChoiceQuestion = parse('::Sample Multiple Choice Question:: Sample Multiple Choice Question {=Choice 1 ~Choice 2}')[0] as MultipleChoiceQuestion;
    const sampleNumericalQuestion = parse('::Sample Numerical Question:: Sample Numerical Question {#5..10}')[0] as NumericalQuestion;
    const sampleShortAnswerQuestion = parse('::Sample Short Answer Question:: Sample Short Answer Question {=Correct Answer =Another Answer}')[0] as ShortAnswerQuestion;

    const mockSubmitAnswer = jest.fn();

    const renderWithContext = (question: any, overrides = {}) => {
        return render(
            <TestQuizContextProvider
                contextOverrides={{
                    questions: [{ question }],
                    index: 0,
                    submitAnswer: mockSubmitAnswer,
                    ...overrides,
                }}
            >
                <QuestionDisplay />
            </TestQuizContextProvider>
        );
    };

    test('renders correctly for True/False question', () => {
        renderWithContext(sampleTrueFalseQuestion);

        expect(screen.getByText('Sample True/False Question')).toBeInTheDocument();
        expect(screen.getByText('Vrai')).toBeInTheDocument();
        expect(screen.getByText('Faux')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('renders correctly for Multiple Choice question', () => {
        renderWithContext(sampleMultipleChoiceQuestion);

        expect(screen.getByText('Sample Multiple Choice Question')).toBeInTheDocument();
        expect(screen.getByText('Choice 1')).toBeInTheDocument();
        expect(screen.getByText('Choice 2')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles selection and submission for Multiple Choice question', () => {
        renderWithContext(sampleMultipleChoiceQuestion);

        const choiceButton = screen.getByText('Choice 1').closest('button')!;
        fireEvent.click(choiceButton);

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockSubmitAnswer).toHaveBeenCalledWith(['Choice 1']);
        mockSubmitAnswer.mockClear();
    });

    test('renders correctly for Numerical question', () => {
        renderWithContext(sampleNumericalQuestion);

        expect(screen.getByText('Sample Numerical Question')).toBeInTheDocument();
        expect(screen.getByTestId('number-input')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles input and submission for Numerical question', () => {
        renderWithContext(sampleNumericalQuestion);

        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;
        fireEvent.change(inputElement, { target: { value: '7' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockSubmitAnswer).toHaveBeenCalledWith([7]);
        mockSubmitAnswer.mockClear();
    });

    test('renders correctly for Short Answer question', () => {
        renderWithContext(sampleShortAnswerQuestion);

        expect(screen.getByText('Sample Short Answer Question')).toBeInTheDocument();
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
        expect(inputElement).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    test('handles input and submission for Short Answer question', () => {
        renderWithContext(sampleShortAnswerQuestion);

        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'User Input' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockSubmitAnswer).toHaveBeenCalledWith(['User Input']);
    });

    test('renders unknown question type', () => {
        const unknownQuestion = { type: 'Unknown', formattedStem: { text: 'Unknown Question' } };
        renderWithContext(unknownQuestion);

        expect(screen.getByText('Question de type inconnue')).toBeInTheDocument();
    });
});