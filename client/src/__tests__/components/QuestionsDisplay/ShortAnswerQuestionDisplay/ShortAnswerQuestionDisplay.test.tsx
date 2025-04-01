import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parse, ShortAnswerQuestion } from 'gift-pegjs';
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
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
        expect(inputElement).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input change correctly', () => {
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'User Input' } });

        expect(inputElement.value).toBe('User Input');
    });

    it('Submit button should be disable if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        expect(submitButton).toBeDisabled();
    });

    it('not submitted answer if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).not.toHaveBeenCalled();
        mockHandleSubmitAnswer.mockClear();
    });

    it('submits answer correctly', () => {
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;

        // const inputElement = screen.getByRole('textbox', { name: 'short-answer-input'}) as HTMLInputElement;
        const submitButton = screen.getByText('Répondre');

        fireEvent.change(inputElement, { target: { value: 'User Input' } });

        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith(['User Input']);
        mockHandleSubmitAnswer.mockClear();
    });
});
