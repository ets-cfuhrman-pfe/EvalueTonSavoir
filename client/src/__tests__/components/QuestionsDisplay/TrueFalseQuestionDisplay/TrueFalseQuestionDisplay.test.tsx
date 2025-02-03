// TrueFalseQuestion.test.tsx
import React, { useState } from 'react';
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


    const TestWrapper = ({ showAnswer }: { showAnswer: boolean }) => {
        const [showAnswerState, setShowAnswerState] = useState(showAnswer);

        const handleOnSubmitAnswer = (answer: boolean) => {
            mockHandleSubmitAnswer(answer);
            setShowAnswerState(true);
        };

        return (
            <MemoryRouter>
                <TrueFalseQuestionDisplay
                    question={trueFalseQuestion}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswerState}
                />
            </MemoryRouter>
        );
    };

    beforeEach(() => {
        render(<TestWrapper showAnswer={false} />);
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


        it('should show ✅ next to the correct answer and ❌ next to the wrong answers when showAnswer is true', async () => {
            const choiceButton = screen.getByText('Vrai').closest('button');
            if (!choiceButton) throw new Error('T button not found');
    
            // Click on choiceButton
            act(() => {
                fireEvent.click(choiceButton);
            });
    
            const button = screen.getByText("Répondre");
    
            act(() => {
                fireEvent.click(button);
            });
    
            // Wait for the DOM to update
                const correctAnswer = screen.getByText("Vrai").closest('button');
                expect(correctAnswer).toBeInTheDocument();
                expect(correctAnswer?.textContent).toContain('✅');
    
                const wrongAnswer1 = screen.getByText("Faux").closest('button');
                expect(wrongAnswer1).toBeInTheDocument();
                expect(wrongAnswer1?.textContent).toContain('❌');
        });
    
        it('should not show ✅ or ❌ when repondre button is not clicked', async () => {
            const choiceButton = screen.getByText('Vrai').closest('button');
            if (!choiceButton) throw new Error('Choice button not found');
    
            // Click on choiceButton
            act(() => {
                fireEvent.click(choiceButton);
            });
    
            // Check for correct answer
            const correctAnswer = screen.getByText("Vrai").closest('button');
            expect(correctAnswer).toBeInTheDocument();
            expect(correctAnswer?.textContent).not.toContain('✅');
    
            // Check for wrong answers
            const wrongAnswer1 = screen.getByText("Faux");
            expect(wrongAnswer1).toBeInTheDocument();
            expect(wrongAnswer1?.textContent).not.toContain('❌');
        });
});
