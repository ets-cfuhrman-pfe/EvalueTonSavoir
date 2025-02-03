import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MultipleChoiceQuestion, parse } from 'gift-pegjs';
import MultipleChoiceQuestionDisplay from 'src/components/QuestionsDisplay/MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';

const questions = parse(
    `::Sample Question 1:: Question stem
    {
        =Choice 1
        ~Choice 2
    }`) as MultipleChoiceQuestion[];

const question = questions[0];

describe('MultipleChoiceQuestionDisplay', () => {
    const mockHandleOnSubmitAnswer = jest.fn();

    const TestWrapper = ({ showAnswer }: { showAnswer: boolean }) => {
        const [showAnswerState, setShowAnswerState] = useState(showAnswer);

        const handleOnSubmitAnswer = (answer: string) => {
            mockHandleOnSubmitAnswer(answer);
            setShowAnswerState(true);
        };

        return (
            <MemoryRouter>
                <MultipleChoiceQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswerState}
                />
            </MemoryRouter>
        );
    };

    const choices = question.choices;

    beforeEach(() => {
        render(<TestWrapper showAnswer={false} />);
    });

    test('renders the question and choices', () => {
        expect(screen.getByText(question.formattedStem.text)).toBeInTheDocument();
        choices.forEach((choice) => {
            expect(screen.getByText(choice.formattedText.text)).toBeInTheDocument();
        });
    });

    test('does not submit when no answer is selected', () => {
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });
        expect(mockHandleOnSubmitAnswer).not.toHaveBeenCalled();
    });

    test('submits the selected answer', () => {
        const choiceButton = screen.getByText('Choice 1').closest('button');
        if (!choiceButton) throw new Error('Choice button not found');
        act(() => {
            fireEvent.click(choiceButton);
        });
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith('Choice 1');
    });

    it('should show ✅ next to the correct answer and ❌ next to the wrong answers when showAnswer is true', async () => {
        const choiceButton = screen.getByText('Choice 1').closest('button');
        if (!choiceButton) throw new Error('Choice button not found');

        // Click on choiceButton
        act(() => {
            fireEvent.click(choiceButton);
        });

        const button = screen.getByText("Répondre");

        act(() => {
            fireEvent.click(button);
        });

        // Wait for the DOM to update
            const correctAnswer = screen.getByText("Choice 1").closest('button');
            expect(correctAnswer).toBeInTheDocument();
            expect(correctAnswer?.textContent).toContain('✅');

            const wrongAnswer1 = screen.getByText("Choice 2").closest('button');
            expect(wrongAnswer1).toBeInTheDocument();
            expect(wrongAnswer1?.textContent).toContain('❌');
    });

    it('should not show ✅ or ❌ when repondre button is not clicked', async () => {
        const choiceButton = screen.getByText('Choice 1').closest('button');
        if (!choiceButton) throw new Error('Choice button not found');

        // Click on choiceButton
        act(() => {
            fireEvent.click(choiceButton);
        });

        // Check for correct answer
        const correctAnswer = screen.getByText("Choice 1").closest('button');
        expect(correctAnswer).toBeInTheDocument();
        expect(correctAnswer?.textContent).not.toContain('✅');

        // Check for wrong answers
        const wrongAnswer1 = screen.getByText("Choice 2");
        expect(wrongAnswer1).toBeInTheDocument();
        expect(wrongAnswer1?.textContent).not.toContain('❌');
    });

    });

