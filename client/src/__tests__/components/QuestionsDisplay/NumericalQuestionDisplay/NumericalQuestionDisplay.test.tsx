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

    it('calculates and displays correct answer rate when showResults is true', () => {
        const mockStudents = [
            {
                id: '1',
                name: 'Alice',
                answers: [{ idQuestion: 1, answer: [7], isCorrect: true }]
            },
            {
                id: '2',
                name: 'Bob',
                answers: [{ idQuestion: 1, answer: [3], isCorrect: false }]
            },
            {
                id: '3',
                name: 'Charlie',
                answers: [{ idQuestion: 1, answer: [6], isCorrect: true }]
            }
        ];
    
        render(
            <MemoryRouter>
                <NumericalQuestionDisplay
                    question={{ ...question, id: '1' }}
                    showResults={true}
                    students={mockStudents}
                />
            </MemoryRouter>
        );
    
        expect(screen.getByText('Taux de réponse correcte: 2/3')).toBeInTheDocument();
        expect(screen.getByText('66.7%')).toBeInTheDocument();
    });
});
