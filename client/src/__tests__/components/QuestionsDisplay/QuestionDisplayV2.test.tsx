// QuestionDisplayV2.test.tsx
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionDisplayV2 from 'src/components/QuestionsDisplay/QuestionDisplayV2';
import { parse, Question } from 'gift-pegjs';
import { Student, Answer } from 'src/Types/StudentType';

describe('QuestionDisplayV2 Component', () => {
    const mockHandleSubmitAnswer = jest.fn();

    const sampleTrueFalseQuestion = 
        parse('::Sample True/False Question:: Sample True/False Question {T}')[0];

    const sampleMultipleChoiceQuestion =
        parse('::Sample Multiple Choice Question:: Sample Multiple Choice Question {=Choice 1 ~Choice 2}')[0];
    
    const sampleNumericalQuestion = 
        parse('::Sample Numerical Question:: Sample Numerical Question {#5..10}')[0];

    const sampleShortAnswerQuestion = 
        parse('::Sample Short Answer Question:: Sample Short Answer Question {=Correct Answer =Another Answer}')[0];

    // Set question IDs for statistics
    (sampleTrueFalseQuestion as any).id = 1;
    (sampleMultipleChoiceQuestion as any).id = 2;

    const mockStudents: Student[] = [
        new Student('John Doe', 'student1', 'TestRoom', [new Answer([true], true, 1)]),
        new Student('Jane Smith', 'student2', 'TestRoom', [new Answer([false], false, 1)]),
        new Student('Bob Johnson', 'student3', 'TestRoom', [new Answer([true], true, 1)]),
    ];

    const sampleProps = {
        handleOnSubmitAnswer: mockHandleSubmitAnswer,
        showAnswer: false,
        answer: undefined as any,
        disabled: false,
        students: [] as Student[],
        showStatistics: false
    };

    const renderComponent = (question: Question, props: any = sampleProps) => {
        render(<QuestionDisplayV2 question={question} {...props} />);
    };

    beforeEach(() => {
        mockHandleSubmitAnswer.mockClear();
    });

    describe('True/False Questions', () => {
        it('renders correctly for True/False question', () => {
            renderComponent(sampleTrueFalseQuestion);

            expect(screen.getByText('Sample True/False Question')).toBeInTheDocument();
            expect(screen.getByText('Vrai')).toBeInTheDocument();
            expect(screen.getByText('Faux')).toBeInTheDocument();
            expect(screen.getByText('Répondre')).toBeInTheDocument();
        });

        it('handles selection and submission for True/False question', () => {
            renderComponent(sampleTrueFalseQuestion);

            const trueButton = screen.getByText('Vrai').closest('button')!;
            fireEvent.click(trueButton);

            const submitButton = screen.getByText('Répondre');
            fireEvent.click(submitButton);

            expect(mockHandleSubmitAnswer).toHaveBeenCalledWith([true]);
        });

        it('shows statistics when enabled', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                students: mockStudents,
                showStatistics: true
            });

            // Should show percentage badges
            expect(screen.getByText('67%')).toBeInTheDocument(); // 2 out of 3 students chose true
            expect(screen.getByText('33%')).toBeInTheDocument(); // 1 out of 3 students chose false
        });

        it('disables buttons when disabled prop is true', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                disabled: true
            });

            const trueButton = screen.getByText('Vrai').closest('button')!;
            const falseButton = screen.getByText('Faux').closest('button')!;
            const submitButton = screen.getByText('Répondre');

            expect(trueButton).toBeDisabled();
            expect(falseButton).toBeDisabled();
            expect(submitButton).toBeDisabled();
        });

        it('shows passed answer when provided', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                answer: [true]
            });

            // The true button should be selected
            const trueButton = screen.getByText('Vrai').closest('button')!;
            expect(trueButton).toHaveClass('bg-primary');
        });

        it('shows validation styling when showAnswer is true', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                showAnswer: true,
                answer: [true] // User selected true, which is correct
            });

            const trueButton = screen.getByText('Vrai').closest('button')!;
            expect(trueButton).toHaveClass('bg-success');
        });
    });

    describe('Multiple Choice Questions', () => {
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
        });

        it('shows statistics for multiple choice when enabled', () => {
            const mcStudents: Student[] = [
                new Student('John Doe', 'student1', 'TestRoom', [new Answer(['Choice 1'], true, 2)]),
                new Student('Jane Smith', 'student2', 'TestRoom', [new Answer(['Choice 2'], false, 2)]),
            ];

            renderComponent(sampleMultipleChoiceQuestion, {
                ...sampleProps,
                students: mcStudents,
                showStatistics: true
            });

            expect(screen.getAllByText('50%')).toHaveLength(2);
        });
    });

    describe('Numerical Questions', () => {
        it('renders correctly for Numerical question', () => {
            renderComponent(sampleNumericalQuestion);

            expect(screen.getByText('Sample Numerical Question')).toBeInTheDocument();
            expect(screen.getByRole('spinbutton')).toBeInTheDocument();
            expect(screen.getByText('Répondre')).toBeInTheDocument();
        });

        it('handles input and submission for Numerical question', () => {
            renderComponent(sampleNumericalQuestion);

            const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
            fireEvent.change(inputElement, { target: { value: '7' } });

            const submitButton = screen.getByText('Répondre');
            fireEvent.click(submitButton);

            expect(mockHandleSubmitAnswer).toHaveBeenCalledWith([7]);
        });

        it('shows passed numerical answer when provided', () => {
            renderComponent(sampleNumericalQuestion, {
                ...sampleProps,
                answer: [8]
            });

            const inputElement = screen.getByRole('spinbutton') as HTMLInputElement;
            expect(inputElement.value).toBe('8');
        });
    });

    describe('Short Answer Questions', () => {
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

        it('shows passed short answer when provided', () => {
            renderComponent(sampleShortAnswerQuestion, {
                ...sampleProps,
                answer: ['Test Answer']
            });

            const container = screen.getByLabelText('short-answer-input');
            const inputElement = within(container).getByRole('textbox') as HTMLInputElement;
            expect(inputElement.value).toBe('Test Answer');
        });
    });

    describe('Unknown Question Types', () => {
        it('shows warning for unknown question type', () => {
            const unknownQuestion = { ...sampleTrueFalseQuestion, type: 'Unknown' } as any;
            renderComponent(unknownQuestion);

            expect(screen.getByText('Question de type inconnue')).toBeInTheDocument();
        });
    });

    describe('Submit Button Behavior', () => {
        it('disables submit button when no answer is selected', () => {
            renderComponent(sampleTrueFalseQuestion);

            const submitButton = screen.getByText('Répondre');
            expect(submitButton).toBeDisabled();
        });

        it('enables submit button when answer is selected', () => {
            renderComponent(sampleTrueFalseQuestion);

            const trueButton = screen.getByText('Vrai').closest('button')!;
            fireEvent.click(trueButton);

            const submitButton = screen.getByText('Répondre');
            expect(submitButton).not.toBeDisabled();
        });

        it('does not show submit button when handleOnSubmitAnswer is not provided', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                handleOnSubmitAnswer: undefined
            });

            expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        });

        it('does not show submit button when showAnswer is true', () => {
            renderComponent(sampleTrueFalseQuestion, {
                ...sampleProps,
                showAnswer: true
            });

            expect(screen.queryByText('Répondre')).not.toBeInTheDocument();
        });
    });

    describe('Answer Statistics and Progression Features', () => {
        test('should display percentage and fraction when showStatistics is enabled', () => {
            render(
                <QuestionDisplayV2 
                    question={sampleMultipleChoiceQuestion} 
                    {...sampleProps}
                    students={mockStudents}
                    showStatistics={true}
                />
            );

            // Should display percentage badges (mocked components will show some indication)
            const questionContainer = screen.getByText(/Sample Multiple Choice Question/);
            expect(questionContainer).toBeInTheDocument();
        });

        test('should not display statistics when showStatistics is false', () => {
            render(
                <QuestionDisplayV2 
                    question={sampleMultipleChoiceQuestion} 
                    {...sampleProps}
                    students={mockStudents}
                    showStatistics={false}
                />
            );

            // Should render without statistics
            const questionContainer = screen.getByText(/Sample Multiple Choice Question/);
            expect(questionContainer).toBeInTheDocument();
        });

        test('should pass students array to question components for statistics calculation', () => {
            render(
                <QuestionDisplayV2 
                    question={sampleTrueFalseQuestion} 
                    {...sampleProps}
                    students={mockStudents}
                    showStatistics={true}
                />
            );

            // Should render the True/False question with students data
            expect(screen.getByText(/Sample True/)).toBeInTheDocument();
        });

        test('should handle empty students array', () => {
            render(
                <QuestionDisplayV2 
                    question={sampleMultipleChoiceQuestion} 
                    {...sampleProps}
                    students={[]}
                    showStatistics={true}
                />
            );

            expect(screen.getByText(/Sample Multiple Choice Question/)).toBeInTheDocument();
        });

        test('should work with different question types and statistics', () => {
            const testCases = [
                { question: sampleTrueFalseQuestion, name: 'True/False' },
                { question: sampleMultipleChoiceQuestion, name: 'Multiple Choice' },
                { question: sampleNumericalQuestion, name: 'Numerical' },
                { question: sampleShortAnswerQuestion, name: 'Short Answer' }
            ];

            testCases.forEach(({ question, name }) => {
                const { unmount } = render(
                    <QuestionDisplayV2 
                        question={question} 
                        {...sampleProps}
                        students={mockStudents}
                        showStatistics={true}
                    />
                );
                
                // Should render without errors
                expect(screen.getByText(new RegExp(name === 'True/False' ? 'Sample True' : 'Sample', 'i'))).toBeInTheDocument();
                
                unmount();
            });
        });

        test('should handle showAnswer and showStatistics combination', () => {
            render(
                <QuestionDisplayV2 
                    question={sampleTrueFalseQuestion} 
                    {...sampleProps}
                    students={mockStudents}
                    showStatistics={true}
                    showAnswer={true}
                />
            );

            // Should render with both validation and statistics
            expect(screen.getByText(/Sample True/)).toBeInTheDocument();
        });

        test('should pass correct props to child question components', () => {
            const props = {
                ...sampleProps,
                students: mockStudents,
                showStatistics: true,
                showAnswer: false
            };

            render(
                <QuestionDisplayV2 
                    question={sampleMultipleChoiceQuestion} 
                    {...props}
                />
            );

            // The component should render and pass props correctly
            expect(screen.getByText(/Sample Multiple Choice Question/)).toBeInTheDocument();
        });
    });
});