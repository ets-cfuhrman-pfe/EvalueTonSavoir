// TrueFalseQuestion.test.tsx
import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import TrueFalseQuestionDisplay from 'src/components/QuestionsDisplay/TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import { parse, TrueFalseQuestion } from 'gift-pegjs';

describe('TrueFalseQuestion Component', () => {
    const mockHandleSubmitAnswer = jest.fn();
    const sampleStem = 'Sample True False Question';
    const trueFalseQuestion = 
        parse(`${sampleStem}{T}`)[0] as TrueFalseQuestion;

    const sampleProps = {
        question: trueFalseQuestion,
        handleOnSubmitAnswer: mockHandleSubmitAnswer,
        showAnswer: false
    };

    beforeEach(() => {
        render(
            <MemoryRouter>
                <TrueFalseQuestionDisplay {...sampleProps} />
            </MemoryRouter>);
    });

    it('renders correctly', () => {
        expect(screen.getByText(sampleStem)).toBeInTheDocument();
        expect(screen.getByText('Vrai')).toBeInTheDocument();
        expect(screen.getByText('Faux')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('Submit button should be disabled if no option is selected', () => {
        const submitButton = screen.getByText('Répondre');
        expect(submitButton).toBeDisabled();
    });

    it('not submit answer if no option is selected', () => {
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockHandleSubmitAnswer).not.toHaveBeenCalled();
    });

    it('submits answer correctly for True', () => {
        const trueButton = screen.getByText('Vrai');
        const submitButton = screen.getByText('Répondre');

        act(() => {
            fireEvent.click(trueButton);
        });

        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith(true);
    });

    it('submits answer correctly for False', () => {
        const falseButton = screen.getByText('Faux');
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(falseButton);
        });
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith(false);
    });
});
