import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NumericalQuestion, parse, ParsedGIFTQuestion } from 'gift-pegjs';
import { MemoryRouter } from 'react-router-dom';
import NumericalQuestionDisplay from 'src/components/QuestionsDisplay/NumericalQuestionDisplay/NumericalQuestionDisplay';

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

describe('NumericalQuestion Component', () => {
    const mockHandleOnSubmitAnswer = jest.fn();

    const sampleProps = {
        question: question,
        handleOnSubmitAnswer: mockHandleOnSubmitAnswer,
        showAnswer: false
    };

    beforeEach(() => {
        render(
            <MemoryRouter>
                <NumericalQuestionDisplay
                    {...sampleProps}
                />
            </MemoryRouter>);
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

    it('Submit button should be disable if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        expect(submitButton).toBeDisabled();
    });

    it('not submited answer if nothing is entered', () => {
        const submitButton = screen.getByText('Répondre');

        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).not.toHaveBeenCalled();
        mockHandleOnSubmitAnswer.mockClear();
    });

    it('submits answer correctly', () => {
        const inputElement = screen.getByTestId('number-input');
        const submitButton = screen.getByText('Répondre');

        fireEvent.change(inputElement, { target: { value: '7' } });

        fireEvent.click(submitButton);

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith([7]);
        mockHandleOnSubmitAnswer.mockClear();
    });
});
