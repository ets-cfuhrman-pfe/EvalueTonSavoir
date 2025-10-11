import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResults from 'src/components/LiveResults/LiveResults';
import { QuestionType } from 'src/Types/QuestionType';
import { Student, Answer } from 'src/Types/StudentType';
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

const mockShowSelectedQuestion = jest.fn();

describe('LiveResults', () => {
    test('renders LiveResults component', () => {
        render(
            <LiveResults
                socket={null}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        expect(screen.getByText('Résultats du quiz')).toBeInTheDocument();
    });

    test('toggles show usernames switch', () => {
        render(
            <LiveResults
                socket={null}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const switchElement = screen.getByLabelText('Afficher les noms');
        expect(switchElement).toBeInTheDocument();

        fireEvent.click(switchElement);
        expect(switchElement).toBeChecked();
    });

    test('toggles show correct answers switch', () => {
        render(
            <LiveResults
                socket={null}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const switchElement = screen.getByLabelText('Afficher les réponses');
        expect(switchElement).toBeInTheDocument();

        fireEvent.click(switchElement);
        expect(switchElement).toBeChecked();
    });

    test('calls showSelectedQuestion when a table cell is clicked', () => {
        render(
            <LiveResults
                socket={null}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const tableCell = screen.getByText('Q1');
        fireEvent.click(tableCell);

        expect(mockShowSelectedQuestion).toHaveBeenCalled();
    });
});
