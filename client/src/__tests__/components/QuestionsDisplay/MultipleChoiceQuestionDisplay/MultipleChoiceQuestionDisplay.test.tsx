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
    }
    
    ::Sample Question 2:: Question stem
    {
        =Choice 1
        =Choice 2
        ~Choice 3
    }
    `) as MultipleChoiceQuestion[];

const questionWithOneCorrectChoice = questions[0];
const questionWithMultipleCorrectChoices = questions[1];

describe('MultipleChoiceQuestionDisplay', () => {
    const mockHandleOnSubmitAnswer = jest.fn();

    const TestWrapper = ({ showAnswer, question }: { showAnswer: boolean; question: MultipleChoiceQuestion }) => {
        const [showAnswerState, setShowAnswerState] = useState(showAnswer);

        const handleOnSubmitAnswer = (answer: AnswerType) => {
            mockHandleOnSubmitAnswer(answer);
            setShowAnswerState(true);
        };

        // Mock validation result - for MultipleChoice, selecting correct choice should be correct
        const mockValidation = {
            idQuestion: 1,
            isCorrect: true,
            feedback: null
        };

        return (
            <MemoryRouter>
                <MultipleChoiceQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswerState}
                    answerValidation={showAnswerState ? mockValidation : undefined}
                />
            </MemoryRouter>
        );
    };

    const twoChoices = questionWithOneCorrectChoice.choices;
    const threeChoices = questionWithMultipleCorrectChoices.choices;

    test('renders a question (that has only one correct choice) and its choices', () => {
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);

        expect(screen.getByText(questionWithOneCorrectChoice.formattedStem.text)).toBeInTheDocument();
        twoChoices.forEach((choice) => {
            expect(screen.getByText(choice.formattedText.text)).toBeInTheDocument();
        });
    });

    test('only allows one choice to be selected when question only has one correct answer', () => {
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);

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

        // Verify that only the last answer is selected
        expect(choiceButton1.querySelector('.answer-text.selected')).not.toBeInTheDocument();
        expect(choiceButton2.querySelector('.answer-text.selected')).toBeInTheDocument();
    });

    test('does not submit when no answer is selected', () => {
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });
        expect(mockHandleOnSubmitAnswer).not.toHaveBeenCalled();
        mockHandleOnSubmitAnswer.mockClear();
    });

    test('submits the selected answer', () => {
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);
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


    test('renders a question (that has multiple correct choices) and its choices', () => {
        render(<TestWrapper showAnswer={false} question={questionWithMultipleCorrectChoices} />);
        expect(screen.getByText(questionWithMultipleCorrectChoices.formattedStem.text)).toBeInTheDocument();
        threeChoices.forEach((choice) => {
            expect(screen.getByText(choice.formattedText.text)).toBeInTheDocument();
        });
    });

    test('allows multiple choices to be selected when question has multiple correct answers', () => {
        render(<TestWrapper showAnswer={false} question={questionWithMultipleCorrectChoices} />);
        const choiceButton1 = screen.getByText('Choice 1').closest('button');
        const choiceButton2 = screen.getByText('Choice 2').closest('button');
        const choiceButton3 = screen.getByText('Choice 3').closest('button');

        if (!choiceButton1 || !choiceButton2 || !choiceButton3) throw new Error('Choice buttons not found');

        act(() => {
            fireEvent.click(choiceButton1);
        });
        act(() => {
            fireEvent.click(choiceButton2);
        });

        expect(choiceButton1.querySelector('.answer-text.selected')).toBeInTheDocument();
        expect(choiceButton2.querySelector('.answer-text.selected')).toBeInTheDocument();
        expect(choiceButton3.querySelector('.answer-text.selected')).not.toBeInTheDocument(); // didn't click
    
    });

    test('submits multiple selected answers', () => {
        render(<TestWrapper showAnswer={false} question={questionWithMultipleCorrectChoices} />);
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
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);
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

    it('should not show ✅ or ❌ when Répondre button is not clicked', async () => {
        render(<TestWrapper showAnswer={false} question={questionWithOneCorrectChoice} />);
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

