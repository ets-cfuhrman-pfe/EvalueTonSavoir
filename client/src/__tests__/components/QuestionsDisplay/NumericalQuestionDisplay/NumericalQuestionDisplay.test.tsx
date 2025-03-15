import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { parse, NumericalQuestion } from 'gift-pegjs';
import React from 'react';
import NumericalQuestionDisplay from 'src/components/QuestionsDisplay/NumericalQuestionDisplay/NumericalQuestionDisplay';

describe('NumericalQuestionDisplay Component', () => {
    const mockHandleOnSubmitAnswer = jest.fn();
    const question = 
        parse('::Sample Numerical Question:: What is 2+2? {#4}')[0] as NumericalQuestion;

    const sampleProps = {
        handleOnSubmitAnswer: mockHandleOnSubmitAnswer,
        showAnswer: false
    };

    beforeEach(() => {
        render(<NumericalQuestionDisplay question={question} {...sampleProps} />);
    });

    it('renders correctly', () => {
        expect(screen.getByText(question.formattedStem.text)).toBeInTheDocument();
        expect(screen.getByTestId('number-input')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input change correctly', () => {
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '7' } });

        expect(inputElement.value).toBe('7');
    });

    it('Submit button should be disabled if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        expect(submitButton).toBeDisabled();
    });

    it('does not submit answer if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).not.toHaveBeenCalled();
    });

    it('submits answer correctly', () => {
        const inputElement = screen.getByTestId('number-input');
        const submitButton = screen.getByText('Répondre');

        fireEvent.change(inputElement, { target: { value: '7' } });

        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(7);
    });

    it('renders correctly with the correct answer shown', () => {
        render(<NumericalQuestionDisplay question={question} {...sampleProps} showAnswer={true} passedAnswer={4} />);
        expect(screen.getByText('Réponse(s) accepté(es):')).toBeInTheDocument();
        expect(screen.getAllByText('4')).toHaveLength(2);
    });

    it('handles input change and checks if the answer is correct', () => {
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '4' } });

        expect(inputElement.value).toBe('4');

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(4);
    });

    it('submits the correct answer', () => {
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '4' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(4);
    });

    it('submits an incorrect answer', () => {
        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: '5' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(5);
    });

    it('displays feedback when the answer is shown', () => {
        render(<NumericalQuestionDisplay question={question} {...sampleProps} showAnswer={true} passedAnswer={5} />);
        expect(screen.getByText('❌ Incorrect!')).toBeInTheDocument();
        expect(screen.getByText('Réponse(s) accepté(es):')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
    });
});