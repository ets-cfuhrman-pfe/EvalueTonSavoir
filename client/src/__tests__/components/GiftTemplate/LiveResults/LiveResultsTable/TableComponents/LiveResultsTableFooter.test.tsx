import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentType } from 'src/Types/StudentType';
import LiveResultsTableFooter from 'src/components/LiveResults/LiveResultsTable/TableComponents/LiveResultTableFooter';


const mockStudents: StudentType[] = [
    { id: "1", name: 'Student 1', answers: [{ idQuestion: 1, answer: ['Answer 1'], isCorrect: true }] },
    { id: "2", name: 'Student 2', answers: [{ idQuestion: 2, answer: ['Answer 2'], isCorrect: false }] },
];

const mockGetStudentGrade = jest.fn((student: StudentType) => {
    const correctAnswers = student.answers.filter(answer => answer.isCorrect).length;
    return (correctAnswers / 2) * 100; // Assuming there are 2 questions
});

describe('LiveResultsTableFooter', () => {
    test('renders LiveResultsTableFooter component', () => {
        render(
            <LiveResultsTableFooter
                maxQuestions={2}
                students={mockStudents}
                getStudentGrade={mockGetStudentGrade}
            />
        );

        expect(screen.getByText('% réussite')).toBeInTheDocument();
    });

    test('calculates and displays correct answers per question', () => {
        render(
            <LiveResultsTableFooter
                maxQuestions={2}
                students={mockStudents}
                getStudentGrade={mockGetStudentGrade}
            />
        );

        expect(screen.getByText('50 %')).toBeInTheDocument();
        expect(screen.getByText('0 %')).toBeInTheDocument();
    });

    test('calculates and displays class average', () => {
        render(
            <LiveResultsTableFooter
                maxQuestions={2}
                students={mockStudents}
                getStudentGrade={mockGetStudentGrade}
            />
        );

        expect(screen.getByText('50 %')).toBeInTheDocument();
    });
});
