import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StudentType } from 'src/Types/StudentType';
import LiveResultsTable from 'src/components/LiveResults/LiveResultsTable/LiveResultsTable';
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
    { id: "1", name: 'Student 1', answers: [{ idQuestion: 1, answer: 'Answer 1', isCorrect: true }] },
    { id: "2", name: 'Student 2', answers: [{ idQuestion: 2, answer: 'Answer 2', isCorrect: false }] },
];

const mockShowSelectedQuestion = jest.fn();

describe('LiveResultsTable', () => {
    test('renders LiveResultsTable component', () => {
        render(
            <LiveResultsTable
                questions={mockQuestions}
                students={mockStudents}
                showCorrectAnswers={false}
                showSelectedQuestion={mockShowSelectedQuestion}
                showUsernames={true}
            />
        );

        expect(screen.getByText('Student 1')).toBeInTheDocument();
        expect(screen.getByText('Student 2')).toBeInTheDocument();
    });

    test('displays correct and incorrect answers', () => {
        render(
            <LiveResultsTable
                questions={mockQuestions}
                students={mockStudents}
                showCorrectAnswers={true}
                showSelectedQuestion={mockShowSelectedQuestion}
                showUsernames={true}
            />
        );

        expect(screen.getByText('Answer 1')).toBeInTheDocument();
        expect(screen.getByText('Answer 2')).toBeInTheDocument();
    });

    test('calls showSelectedQuestion when a table cell is clicked', () => {
        render(
            <LiveResultsTable
                questions={mockQuestions}
                students={mockStudents}
                showCorrectAnswers={true}
                showSelectedQuestion={mockShowSelectedQuestion}
                showUsernames={true}
            />
        );

        const tableCell = screen.getByText('Q1');
        fireEvent.click(tableCell);

        expect(mockShowSelectedQuestion).toHaveBeenCalled();
    });

    test('calculates and displays student grades', () => {
        render(
            <LiveResultsTable
                questions={mockQuestions}
                students={mockStudents}
                showCorrectAnswers={true}
                showSelectedQuestion={mockShowSelectedQuestion}
                showUsernames={true}
            />
        );

        //50% because only one of the two questions have been answered (getALLByText, because there are a value 50% for the %reussite de la question
        // and a second one for the student grade)
        const gradeElements = screen.getAllByText('50 %');
        expect(gradeElements).toHaveLength(2);

        const gradeElements2 = screen.getAllByText('0 %');
        expect(gradeElements2).toHaveLength(2);    });

    test('calculates and displays class average', () => {
        render(
            <LiveResultsTable
                questions={mockQuestions}
                students={mockStudents}
                showCorrectAnswers={true}
                showSelectedQuestion={mockShowSelectedQuestion}
                showUsernames={true}
            />
        );

        //1 good answer out of 4 possible good answers (the second question has not been answered)
        expect(screen.getByText('25 %')).toBeInTheDocument();
    });
});
