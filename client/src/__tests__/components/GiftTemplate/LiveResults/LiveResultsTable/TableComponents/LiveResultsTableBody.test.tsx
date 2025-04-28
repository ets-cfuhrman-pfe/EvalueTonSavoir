import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentType } from 'src/Types/StudentType';
import LiveResultsTableBody from 'src/components/LiveResults/LiveResultsTable/TableComponents/LiveResultsTableBody';
import { QuestionType } from 'src/Types/QuestionType';
import { BaseQuestion, parse } from 'gift-pegjs';


const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Answer 1 ~Answer 2}
    
    ::Sample Question 2:: Sample Question 2 {T}`);

const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
    if (question.type !== "Category")
        question.id = (index + 1).toString();
    const newMockQuestion = question;
    return {question : newMockQuestion as BaseQuestion};
});

const mockStudents: StudentType[] = [
    { id: "1", name: 'Student 1', answers: [{ idQuestion: 1, answer: ['Answer 1'], isCorrect: true }] },
    { id: "2", name: 'Student 2', answers: [{ idQuestion: 2, answer: ['Answer 2'], isCorrect: false }] },
];

const mockGetStudentGrade = jest.fn((student: StudentType) => {
    const correctAnswers = student.answers.filter(answer => answer.isCorrect).length;
    return (correctAnswers / mockQuestions.length) * 100;
});

describe('LiveResultsTableBody', () => {
    test('renders LiveResultsTableBody component', () => {
        render(
            <LiveResultsTableBody
                maxQuestions={2}
                students={mockStudents}
                showUsernames={true}
                showCorrectAnswers={false}
                getStudentGrade={mockGetStudentGrade}

            />
        );

        expect(screen.getByText('Student 1')).toBeInTheDocument();
        expect(screen.getByText('Student 2')).toBeInTheDocument();
    });

    test('displays correct and incorrect answers', () => {
        render(
            <LiveResultsTableBody
                maxQuestions={2}
                students={mockStudents}
                showUsernames={true}
                showCorrectAnswers={true}
                getStudentGrade={mockGetStudentGrade}

            />
        );

        expect(screen.getByText('Answer 1')).toBeInTheDocument();
    });

    test('displays icons for correct and incorrect answers when showCorrectAnswers is false', () => {
        render(
            <LiveResultsTableBody
                maxQuestions={2}
                students={mockStudents}
                showUsernames={true}
                showCorrectAnswers={false}
                getStudentGrade={mockGetStudentGrade}

            />
        );

        expect(screen.getByLabelText('correct')).toBeInTheDocument();
    });

    test('hides usernames when showUsernames is false', () => {
        render(
            <LiveResultsTableBody
                maxQuestions={2}
                students={mockStudents}
                showUsernames={false}
                showCorrectAnswers={true}
                getStudentGrade={mockGetStudentGrade}

            />
        );

        expect(screen.getAllByText('******')).toHaveLength(2);
    });
});
