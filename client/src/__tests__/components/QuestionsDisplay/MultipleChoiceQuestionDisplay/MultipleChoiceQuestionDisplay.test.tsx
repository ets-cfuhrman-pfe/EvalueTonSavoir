import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { MultipleChoiceQuestion, parse } from 'gift-pegjs';
import MultipleChoiceQuestionDisplay from 'src/components/QuestionsDisplay/MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

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

        const handleOnSubmitAnswer = (answer: AnswerType) => {
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
        mockHandleOnSubmitAnswer.mockClear();
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

        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(['Choice 1']);
        mockHandleOnSubmitAnswer.mockClear();
    });

    test('submits multiple selected answers', () => {
        const choiceButton1 = screen.getByText('Choice 1').closest('button');
        const choiceButton2 = screen.getByText('Choice 2').closest('button');
    
        if (!choiceButton1 || !choiceButton2) throw new Error('Choice buttons not found');
    
        // Simulate selecting multiple answers
        act(() => {
            fireEvent.click(choiceButton1);
        });
        act(() => {
            fireEvent.click(choiceButton2);
        });
    
        // Simulate submitting the answers
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });
    
        // Verify that the mockHandleOnSubmitAnswer function is called with both answers
        expect(mockHandleOnSubmitAnswer).toHaveBeenCalledWith(['Choice 1', 'Choice 2']);
        mockHandleOnSubmitAnswer.mockClear();
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

