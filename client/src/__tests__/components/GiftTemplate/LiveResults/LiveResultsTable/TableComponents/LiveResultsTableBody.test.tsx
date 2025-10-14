import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Student, Answer } from 'src/Types/StudentType';
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

const mockStudents: Student[] = [
    new Student('Student 1', '1', 'TestRoom', [new Answer(['Answer 1'], true, 1)]),
    new Student('Student 2', '2', 'TestRoom', [new Answer(['Answer 2'], false, 2)]),
];

const mockGetStudentGrade = jest.fn((student: Student) => {
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
        expect(screen.getByText('Answer 2')).toBeInTheDocument();
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
        expect(screen.getByLabelText('incorrect')).toBeInTheDocument();
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
