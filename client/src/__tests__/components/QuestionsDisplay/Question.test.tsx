// Question.test.tsx
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import { parse, Question } from 'gift-pegjs';

describe('Questions Component', () => {
    const mockHandleSubmitAnswer = jest.fn();

    const sampleTrueFalseQuestion = 
        parse('::Sample True/False Question:: Sample True/False Question {T}')[0];

    const sampleMultipleChoiceQuestion =
        parse('::Sample Multiple Choice Question:: Sample Multiple Choice Question {=Choice 1 ~Choice 2}')[0];
    
    const sampleNumericalQuestion = 
        parse('::Sample Numerical Question:: Sample Numerical Question {#5..10}')[0];

    const sampleShortAnswerQuestion = 
        parse('::Sample Short Answer Question:: Sample Short Answer Question {=Correct Answer =Another Answer}')[0];

    const sampleProps = {
        handleOnSubmitAnswer: mockHandleSubmitAnswer,
        showAnswer: false
    };

    const renderComponent = (question: Question, showAnswerToggle = false) => {
        render(<QuestionDisplay question={question} showAnswerToggle={showAnswerToggle} {...sampleProps} />);
    };

    // describe('question type parsing', () => {
    //     it('parses true/false question type correctly', () => {
    //         expect(sampleTrueFalseQuestion.type).toBe('TF');
    //     });

    //     it('parses multiple choice question type correctly', () => {
    //         expect(sampleMultipleChoiceQuestion.type).toBe('MC');
    //     });

    //     it('parses numerical question type correctly', () => {
    //         expect(sampleNumericalQuestion.type).toBe('Numerical');
    //     });

    //     it('parses short answer question type correctly', () => {
    //         expect(sampleShortAnswerQuestion.type).toBe('Short');
    //     });
    // });

    it('renders correctly for True/False question', () => {
        renderComponent(sampleTrueFalseQuestion);

        expect(screen.getByText('Sample True/False Question')).toBeInTheDocument();
        expect(screen.getByText('Vrai')).toBeInTheDocument();
        expect(screen.getByText('Faux')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('renders correctly for Multiple Choice question', () => {
        renderComponent(sampleMultipleChoiceQuestion);

        expect(screen.getByText('Sample Multiple Choice Question')).toBeInTheDocument();
        expect(screen.getByText('Choice 1')).toBeInTheDocument();
        expect(screen.getByText('Choice 2')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles selection and submission for Multiple Choice question', () => {
        renderComponent(sampleMultipleChoiceQuestion);

        const choiceButton = screen.getByText('Choice 1').closest('button')!;
        fireEvent.click(choiceButton);

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith(['Choice 1']);
        mockHandleSubmitAnswer.mockClear();
    });

    it('renders correctly for Numerical question', () => {
        renderComponent(sampleNumericalQuestion);

        expect(screen.getByText('Sample Numerical Question')).toBeInTheDocument();
        expect(screen.getByTestId('number-input')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input and submission for Numerical question', () => {
        renderComponent(sampleNumericalQuestion);

        const inputElement = screen.getByTestId('number-input') as HTMLInputElement;
        fireEvent.change(inputElement, { target: { value: '7' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith([7]);
        mockHandleSubmitAnswer.mockClear();
    });

    it('renders correctly for Short Answer question', () => {
        renderComponent(sampleShortAnswerQuestion);

        expect(screen.getByText('Sample Short Answer Question')).toBeInTheDocument();
        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
        expect(inputElement).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('handles input and submission for Short Answer question', () => {
        renderComponent(sampleShortAnswerQuestion);

        const container = screen.getByLabelText('short-answer-input');
        const inputElement = within(container).getByRole('textbox') as HTMLInputElement;

        fireEvent.change(inputElement, { target: { value: 'User Input' } });

        const submitButton = screen.getByText('Répondre');
        fireEvent.click(submitButton);

        expect(mockHandleSubmitAnswer).toHaveBeenCalledWith(['User Input']);
    });

    it('shows "Afficher les résultats" toggle when showAnswerToggle is true', () => {
        renderComponent(sampleTrueFalseQuestion, true);
        expect(screen.getByText('Afficher les résultats')).toBeInTheDocument();
    });
});


