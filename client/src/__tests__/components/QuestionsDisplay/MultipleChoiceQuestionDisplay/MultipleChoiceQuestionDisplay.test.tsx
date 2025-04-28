import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parse, MultipleChoiceQuestion } from 'gift-pegjs';
import MultipleChoiceQuestionDisplay from 'src/components/QuestionsDisplay/MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import { TestQuizContextProvider } from 'src/__mocks__/MockQuizContext';

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
    `
) as MultipleChoiceQuestion[];

const questionWithOneCorrectChoice = questions[0];
const questionWithMultipleCorrectChoices = questions[1];

describe('MultipleChoiceQuestionDisplay with QuizContext', () => {
    const renderWithContext = (overrides = {}) => {
        return render(
            <TestQuizContextProvider
                contextOverrides={{
                    questions: [{ question: questionWithOneCorrectChoice }, { question: questionWithMultipleCorrectChoices }],
                    index: 0, // Default to the first question
                    ...overrides,
                }}
            >
                <MultipleChoiceQuestionDisplay />
            </TestQuizContextProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders a question (that has only one correct choice) and its choices', () => {
        renderWithContext({ index: 0 }); // Render the first question
        expect(screen.getByText(questionWithOneCorrectChoice.formattedStem.text)).toBeInTheDocument();
        questionWithOneCorrectChoice.choices.forEach((choice) => {
            expect(screen.getByText(choice.formattedText.text)).toBeInTheDocument();
        });
    });

    test('only allows one choice to be selected when question only has one correct answer', () => {
        renderWithContext({ index: 0 }); // Render the first question
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

    test('renders a question (that has multiple correct choices) and its choices', () => {
        renderWithContext({ index: 1 }); // Render the second question
        expect(screen.getByText(questionWithMultipleCorrectChoices.formattedStem.text)).toBeInTheDocument();
        questionWithMultipleCorrectChoices.choices.forEach((choice) => {
            expect(screen.getByText(choice.formattedText.text)).toBeInTheDocument();
        });
    });

    test('allows multiple choices to be selected when question has multiple correct answers', () => {
        renderWithContext({ index: 1 }); // Render the second question
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

    test.skip('submits multiple selected answers', () => {
        renderWithContext({ index: 1 }); // Render the second question
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

        // Verify that the selected answers are submitted
        expect(screen.getByText('✅')).toBeInTheDocument();
    });
});