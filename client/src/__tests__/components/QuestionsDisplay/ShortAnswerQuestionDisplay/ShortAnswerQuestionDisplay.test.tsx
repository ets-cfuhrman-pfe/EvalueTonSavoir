import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse, ShortAnswerQuestion } from 'gift-pegjs';
import React from 'react';
import ShortAnswerQuestionDisplay from 'src/components/QuestionsDisplay/ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';

describe('ShortAnswerQuestion Component', () => {
    const mockHandleSubmitAnswer = jest.fn();
    const question = 
        parse('::Sample Short Answer Question:: Sample Short Answer Question {=Correct Answer ~Incorrect Answer}')[0] as ShortAnswerQuestion;

    const sampleProps = {
        handleOnSubmitAnswer: mockHandleSubmitAnswer,
        showAnswer: false
    };

    beforeEach(() => {
        render(<ShortAnswerQuestionDisplay question={question} {...sampleProps} />);
    });

    it('renders correctly', () => {
        expect(screen.getByText(question.formattedStem.text)).toBeInTheDocument();
        const inputElement = screen.getByRole('textbox') as HTMLInputElement;
        expect(inputElement).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input change correctly', () => {
        const inputElement = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'User Input' } });

        expect(inputElement.value).toBe('User Input');
    });

    it('Submit button should be disabled if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        expect(submitButton).toBeDisabled();
    });

    it('does not submit answer if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).not.toHaveBeenCalled();
    });

    it('renders correctly with the correct answer shown', () => {
        render(<ShortAnswerQuestionDisplay question={question} {...sampleProps} showAnswer={true} passedAnswer="Correct Answer" />);
        expect(screen.getByText('Réponse(s) accepté(es):')).toBeInTheDocument();
        expect(screen.getByText('Correct Answer')).toBeInTheDocument();
    });

    it('handles input change and checks if the answer is correct', () => {
        const inputElement = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'Correct Answer' } });

        expect(inputElement.value).toBe('Correct Answer');

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith('Correct Answer');
    });

    it('submits the correct answer', () => {
        const inputElement = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'Correct Answer' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith('Correct Answer');
    });

    it('submits an incorrect answer', () => {
        const inputElement = screen.getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'Incorrect Answer' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith('Incorrect Answer');
    });

    it('displays feedback when the answer is shown', () => {
        render(<ShortAnswerQuestionDisplay question={question} {...sampleProps} showAnswer={true} passedAnswer="Incorrect Answer" />);
        expect(screen.getByText('❌ Incorrect!')).toBeInTheDocument();
        expect(screen.getByText('Réponse(s) accepté(es):')).toBeInTheDocument();
        expect(screen.getByText('Incorrect Answer')).toBeInTheDocument();
    });
});