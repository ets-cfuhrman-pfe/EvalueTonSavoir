import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentType, Answer } from 'src/Types/StudentType';
import LiveResultsTableFooter from 'src/components/LiveResults/LiveResultsTable/TableComponents/LiveResultTableFooter';


const mockStudents: StudentType[] = [
    new StudentType('Student 1', '1', 'TestRoom', [new Answer(['Answer 1'], true, 1)]),
    new StudentType('Student 2', '2', 'TestRoom', [new Answer(['Answer 2'], false, 2)]),
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

        // Question 1: 1 correct out of 1 who answered = 100%
        expect(screen.getByText('100 %')).toBeInTheDocument();
        // Question 2: 0 correct out of 1 who answered = 0%
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

        // Class average: (50% + 0%) / 2 = 25%
        expect(screen.getByText('25 %')).toBeInTheDocument();
    });
});
