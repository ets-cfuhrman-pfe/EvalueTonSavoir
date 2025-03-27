import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResults from 'src/components/LiveResults/LiveResults';
import { QuestionType } from 'src/Types/QuestionType';
import { StudentType } from 'src/Types/StudentType';
import { Socket } from 'socket.io-client';
import { BaseQuestion, parse } from 'gift-pegjs';

const mockSocket: Socket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
} as unknown as Socket;

const mockGiftQuestions = parse(
    `::Sample Question 1:: Question stem
    {
        =Choice 1
        =Choice 2
        ~Choice 3
        ~Choice 4
    }
    
    ::Sample Question 2:: Question stem {TRUE}
    `);

const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
    if (question.type !== "Category")
        question.id = (index + 1).toString();
    const newMockQuestion = question;
    return { question: newMockQuestion as BaseQuestion };
});

console.log(`mockQuestions: ${JSON.stringify(mockQuestions)}`);

// each student should have a different score for the tests to pass
const mockStudents: StudentType[] = [
    { id: '1', name: 'Student 1', answers: [] },
    { id: '2', name: 'Student 2', answers: [{ idQuestion: 1, answer: ['Choice 3'], isCorrect: false }, { idQuestion: 2, answer: [true], isCorrect: true}] },
    { id: '3', name: 'Student 3', answers: [{ idQuestion: 1, answer: ['Choice 1', 'Choice 2'], isCorrect: true }, { idQuestion: 2, answer: [true], isCorrect: true}] },
];

describe('LiveResults', () => {
    test('renders the component with questions and students', () => {
        render(
            <LiveResults
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={jest.fn()}
                quizMode="teacher"
                students={mockStudents}
            />
        );
        expect(screen.getByText(`Q${1}`)).toBeInTheDocument();

        // Toggle the display of usernames
        const toggleUsernamesSwitch = screen.getByLabelText('Afficher les noms');

        // Toggle the display of usernames back
        fireEvent.click(toggleUsernamesSwitch);

        // Check if the component renders the students
        mockStudents.forEach((student) => {
            expect(screen.getByText(student.name)).toBeInTheDocument();
        });
    });

    test('toggles the display of usernames', () => {
        render(
            <LiveResults
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={jest.fn()}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Toggle the display of usernames
        const toggleUsernamesSwitch = screen.getByLabelText('Afficher les noms');

        // Toggle the display of usernames back
        fireEvent.click(toggleUsernamesSwitch);

        // Check if the usernames are shown again
        mockStudents.forEach((student) => {
            expect(screen.getByText(student.name)).toBeInTheDocument();
        });
    });

    test('calculates and displays the correct student grades', () => {
        render(
            <LiveResults
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={jest.fn()}
                quizMode="teacher"
                students={mockStudents}
            />
        );


        // Toggle the display of usernames
        const toggleUsernamesSwitch = screen.getByLabelText('Afficher les noms');

        // Toggle the display of usernames back
        fireEvent.click(toggleUsernamesSwitch);

        // Check if the student grades are calculated and displayed correctly
        const getByTextInTableCellBody = (text: string) => {
            const elements = screen.getAllByText(text); // Get all elements with the specified text
            return elements.find((element) => element.closest('.MuiTableCell-body')); // don't get the footer element(s)
        };
        mockStudents.forEach((student) => {
            const grade = student.answers.filter(answer => answer.isCorrect).length / mockQuestions.length * 100;
            const element = getByTextInTableCellBody(`${grade.toFixed()} %`);
            expect(element).toBeInTheDocument();
       });
    });

    test('calculates and displays the class average', () => {
        render(
            <LiveResults
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={jest.fn()}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Toggle the display of usernames
        const toggleUsernamesSwitch = screen.getByLabelText('Afficher les noms');

        // Toggle the display of usernames back
        fireEvent.click(toggleUsernamesSwitch);

        // Calculate the class average
        const totalGrades = mockStudents.reduce((total, student) => {
            return total + (student.answers.filter(answer => answer.isCorrect).length / mockQuestions.length * 100);
        }, 0);
        const classAverage = totalGrades / mockStudents.length;

        // Check if the class average is displayed correctly
        const classAverageElements = screen.getAllByText(`${classAverage.toFixed()} %`);
        const classAverageElement = classAverageElements.find((element) => {
            return element.closest('td')?.classList.contains('MuiTableCell-footer');
        });
        expect(classAverageElement).toBeInTheDocument();
    });

    test('displays the correct answers per question', () => {
        render(
            <LiveResults
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={jest.fn()}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Check if the correct answers per question are displayed correctly
        mockQuestions.forEach((_, index) => {
            const correctAnswers = mockStudents.filter(student => student.answers.some(answer => answer.idQuestion === index + 1 && answer.isCorrect)).length;
            const correctAnswersPercentage = (correctAnswers / mockStudents.length) * 100;
            const correctAnswersElements = screen.getAllByText(`${correctAnswersPercentage.toFixed()} %`);
            const correctAnswersElement = correctAnswersElements.find((element) => {
                return element.closest('td')?.classList.contains('MuiTableCell-root');
            });
            expect(correctAnswersElement).toBeInTheDocument();
        });
    });

});
