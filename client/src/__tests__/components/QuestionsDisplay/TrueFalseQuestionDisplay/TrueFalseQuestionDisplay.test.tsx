import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import TrueFalseQuestionDisplay from 'src/components/QuestionsDisplay/TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import { parse, TrueFalseQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { QuizProvider } from 'src/pages/Student/JoinRoom/QuizProvider';
// import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

describe('TrueFalseQuestion Component with QuizContext', () => {
    const mockHandleSubmitAnswer = jest.fn();
    const sampleStem = 'Sample True False Question';
    const trueFalseQuestion =
        parse(`${sampleStem}{T}`)[0] as TrueFalseQuestion;
        
    const TestWrapper = () => {
        const handleOnSubmitAnswer = (answer: AnswerType) => {
            mockHandleSubmitAnswer(answer);
            // setShowAnswer(true); // set it in the context
        };

        return (
            <QuizProvider>
                <MemoryRouter>
                    <TrueFalseQuestionDisplay
                        question={trueFalseQuestion}
                        handleOnSubmitAnswer={handleOnSubmitAnswer}
                    />
                </MemoryRouter>
            </QuizProvider>
        );
    };

    beforeEach(() => {
        render(<TestWrapper />);
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
        mockHandleSubmitAnswer.mockClear();
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

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith([true]);
        mockHandleSubmitAnswer.mockClear();
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

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith([false]);
        mockHandleSubmitAnswer.mockClear();
    });

    it('should show ✅ next to the correct answer and ❌ next to the wrong answers when showAnswer is true', async () => {
        const trueButton = screen.getByText('Vrai').closest('button');
        if (!trueButton) throw new Error('True button not found');

        // Click on trueButton
        act(() => {
            fireEvent.click(trueButton);
        });

        const submitButton = screen.getByText('Répondre');

        act(() => {
            fireEvent.click(submitButton);
        });

        // Wait for the DOM to update
        const correctAnswer = screen.getByText('Vrai').closest('button');
        expect(correctAnswer).toBeInTheDocument();
        expect(correctAnswer?.textContent).toContain('✅');

        const wrongAnswer = screen.getByText('Faux').closest('button');
        expect(wrongAnswer).toBeInTheDocument();
        expect(wrongAnswer?.textContent).toContain('❌');
    });

    it('should not show ✅ or ❌ when Répondre button is not clicked', async () => {
        const trueButton = screen.getByText('Vrai').closest('button');
        if (!trueButton) throw new Error('True button not found');

        // Click on trueButton
        act(() => {
            fireEvent.click(trueButton);
        });

        // Check for correct answer
        const correctAnswer = screen.getByText('Vrai').closest('button');
        expect(correctAnswer).toBeInTheDocument();
        expect(correctAnswer?.textContent).not.toContain('✅');

        // Check for wrong answers
        const wrongAnswer = screen.getByText('Faux').closest('button');
        expect(wrongAnswer).toBeInTheDocument();
        expect(wrongAnswer?.textContent).not.toContain('❌');
    });
});
