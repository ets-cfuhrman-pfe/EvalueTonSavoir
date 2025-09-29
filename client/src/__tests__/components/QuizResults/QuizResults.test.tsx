import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuizResults from 'src/components/QuizResults/QuizResults';
import { StudentType } from 'src/Types/StudentType';
import { QuestionType } from 'src/Types/QuestionType';

// Mock data
const mockQuestions: QuestionType[] = [
    { question: { text: 'Question 1', type: 'short_answer' } as any },
    { question: { text: 'Question 2', type: 'short_answer' } as any },
    { question: { text: 'Question 3', type: 'short_answer' } as any },
];

const mockStudents: StudentType[] = [
    {
        id: '1',
        name: 'Alice',
        answers: [
            { answer: 'A' as any, isCorrect: true, idQuestion: 1 },
            { answer: 'B' as any, isCorrect: false, idQuestion: 2 },
            { answer: 'C' as any, isCorrect: true, idQuestion: 3 },
        ],
    },
    {
        id: '2',
        name: 'Bob',
        answers: [
            { answer: 'A' as any, isCorrect: false, idQuestion: 1 },
            { answer: 'B' as any, isCorrect: true, idQuestion: 2 },
        ],
    },
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
        const currentStudent: StudentType = {
            id: '1',
            name: 'Alice',
            answers: [
                { answer: 'A' as any, isCorrect: true, idQuestion: 1 },
                { answer: 'B' as any, isCorrect: false, idQuestion: 2 },
                { answer: 'C' as any, isCorrect: true, idQuestion: 3 },
            ],
        };

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
        const studentWithNoAnswers: StudentType = {
            id: '3',
            name: 'Charlie',
            answers: [],
        };

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
        const studentWithDuplicates: StudentType = {
            id: '4',
            name: 'Dave',
            answers: [
                { answer: 'A' as any, isCorrect: true, idQuestion: 1 },
                { answer: 'A' as any, isCorrect: false, idQuestion: 1 },
                { answer: 'B' as any, isCorrect: true, idQuestion: 2 },
            ],
        };

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