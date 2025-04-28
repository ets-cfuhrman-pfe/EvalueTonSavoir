import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import TrueFalseQuestionDisplay from 'src/components/QuestionsDisplay/TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import { TestQuizContextProvider, mockContextValue } from 'src/__mocks__/MockQuizContext.tsx';

describe('TrueFalseQuestion Component with QuizContext', () => {
    // Helper function to render the component with context and router
    const renderWithContext = (overrides = {}) => {
        return render(
            <TestQuizContextProvider contextOverrides={overrides}>
                <MemoryRouter>
                    <TrueFalseQuestionDisplay />
                </MemoryRouter>
            </TestQuizContextProvider>
        );
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        renderWithContext();
        expect(screen.getByText('Vrai')).toBeInTheDocument();
        expect(screen.getByText('Faux')).toBeInTheDocument();
        expect(screen.getByText('Répondre')).toBeInTheDocument();
    });

    it('Submit button should be disabled if no option is selected', () => {
        renderWithContext();
        const submitButton = screen.getByText('Répondre');
        expect(submitButton).toBeDisabled();
    });

    it('does not submit answer if no option is selected', () => {
        renderWithContext();
        const submitButton = screen.getByText('Répondre');
        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockContextValue.submitAnswer).not.toHaveBeenCalled();
    });

    it('submits answer correctly for True', () => {
        renderWithContext();
        const trueButton = screen.getByText('Vrai');
        const submitButton = screen.getByText('Répondre');

        act(() => {
            fireEvent.click(trueButton);
        });

        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockContextValue.submitAnswer).toHaveBeenCalledWith([true]);
    });

    it('submits answer correctly for False', () => {
        renderWithContext();
        const falseButton = screen.getByText('Faux');
        const submitButton = screen.getByText('Répondre');

        act(() => {
            fireEvent.click(falseButton);
        });

        act(() => {
            fireEvent.click(submitButton);
        });

        expect(mockContextValue.submitAnswer).toHaveBeenCalledWith([false]);
    });

    it.skip('should show ✅ next to the correct answer and ❌ next to the wrong answers when showAnswer is true', () => {
        renderWithContext({ showAnswer: true, answers: [{ answer: [true] }] });
        const trueButton = screen.getByText('Vrai').closest('button');
        const falseButton = screen.getByText('Faux').closest('button');

        expect(trueButton).toBeInTheDocument();
        expect(trueButton?.textContent).toContain('✅');

        expect(falseButton).toBeInTheDocument();
        expect(falseButton?.textContent).toContain('❌');
    });

    it.skip('should not show ✅ or ❌ when Répondre button is not clicked', () => {
        renderWithContext();
        const trueButton = screen.getByText('Vrai').closest('button');
        const falseButton = screen.getByText('Faux').closest('button');

        expect(trueButton).toBeInTheDocument();
        expect(trueButton?.textContent).not.toContain('✅');

        expect(falseButton).toBeInTheDocument();
        expect(falseButton?.textContent).not.toContain('❌');
    });

    it.skip('renders global feedback when showAnswer is true and global feedback exists', () => {
        renderWithContext({
            showAnswer: true,
            questions: [
                {
                    question: {
                        ...mockContextValue.questions[0].question,
                        formattedGlobalFeedback: 'This is global feedback.',
                    },
                },
            ],
        });

        expect(screen.getByText('This is global feedback.')).toBeInTheDocument();
    });

    it('does not render global feedback when showAnswer is false', () => {
        renderWithContext();
        expect(screen.queryByText('This is global feedback.')).not.toBeInTheDocument();
    });
});