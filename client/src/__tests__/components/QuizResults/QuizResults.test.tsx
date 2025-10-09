import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizResults from 'src/components/QuizResults/QuizResults';
import { StudentType, Answer } from 'src/Types/StudentType';
import { QuestionType } from 'src/Types/QuestionType';

// Mock data
const mockQuestions: QuestionType[] = [
    { question: { text: 'Question 1', type: 'short_answer' } as any },
    { question: { text: 'Question 2', type: 'short_answer' } as any },
    { question: { text: 'Question 3', type: 'short_answer' } as any },
];

const mockStudents: StudentType[] = [
    new StudentType('Alice', '1', 'TestRoom', [
        new Answer('A' as any, true, 1),
        new Answer('B' as any, false, 2),
        new Answer('C' as any, true, 3),
    ]),
    new StudentType('Bob', '2', 'TestRoom', [
        new Answer('A' as any, false, 1),
        new Answer('B' as any, true, 2),
    ]),
];

describe('QuizResults Component', () => {
    it('does not render when isOpen is false', () => {
        const { container } = render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={false}
            />
        );

        expect(container.firstChild).toBeNull();
    });

    it('renders the modal when isOpen is true', () => {
        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={true}
            />
        );

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Résultats du Quiz')).toBeInTheDocument();
    });

    it('renders the quiz results with title', () => {
        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                quizTitle="Sample Quiz"
                isOpen={true}
            />
        );

        expect(screen.getByText('Quiz terminé!')).toBeInTheDocument();
        expect(screen.getByText('Sample Quiz')).toBeInTheDocument();
        expect(screen.getByText('Résultats finaux')).toBeInTheDocument();
    });

    it('renders the table with student results', () => {
        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={true}
            />
        );

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument();
        expect(screen.getByText('33%')).toBeInTheDocument();
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
        expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    it('renders in student view with current student', () => {
        const currentStudent: StudentType = new StudentType('Alice', '1', 'TestRoom', [
            new Answer('A' as any, true, 1),
            new Answer('B' as any, false, 2),
            new Answer('C' as any, true, 3),
        ]);

        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isStudentView={true}
                currentStudent={currentStudent}
                isOpen={true}
            />
        );

        expect(screen.getByText('Votre résultat')).toBeInTheDocument();
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });

    it('handles student with no answers', () => {
        const studentWithNoAnswers: StudentType = new StudentType('Charlie', '3', 'TestRoom');

        render(
            <QuizResults
                students={[studentWithNoAnswers]}
                questions={mockQuestions}
                isOpen={true}
            />
        );

        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.getByText('0%')).toBeInTheDocument();
        expect(screen.getByText('0 / 3')).toBeInTheDocument();
    });

    it('calculates grade correctly with duplicate question answers', () => {
        const studentWithDuplicates: StudentType = new StudentType('Dave', '4', 'TestRoom', [
            new Answer('A' as any, true, 1),
            new Answer('A' as any, false, 1),
            new Answer('B' as any, true, 2),
        ]);

        render(
            <QuizResults
                students={[studentWithDuplicates]}
                questions={mockQuestions}
                isOpen={true}
            />
        );

        expect(screen.getByText('Dave')).toBeInTheDocument();
        expect(screen.getByText('67%')).toBeInTheDocument(); // 2/3 correct
        expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    it('renders without quiz title', () => {
        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={true}
            />
        );

        expect(screen.getByText('Quiz terminé!')).toBeInTheDocument();
        expect(screen.queryByText('Sample Quiz')).not.toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
        const mockOnClose = jest.fn();

        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={true}
                onClose={mockOnClose}
            />
        );

        const closeButton = screen.getByLabelText('Close');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when footer close button is clicked', () => {
        const mockOnClose = jest.fn();

        render(
            <QuizResults
                students={mockStudents}
                questions={mockQuestions}
                isOpen={true}
                onClose={mockOnClose}
            />
        );

        const closeButton = screen.getByText('Fermer');
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});