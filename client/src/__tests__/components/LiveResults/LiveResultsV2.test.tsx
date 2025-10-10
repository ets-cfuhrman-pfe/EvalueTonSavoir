import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResultsV2 from 'src/components/LiveResults/LiveResultsV2';
import { QuestionType } from 'src/Types/QuestionType';
import { StudentType, Answer } from 'src/Types/StudentType';
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

const mockStudents: StudentType[] = [
    {
        id: '1',
        name: 'Connected Student',
        answers: [
            { idQuestion: 1, answer: ['Choice 1'], isCorrect: true },
            { idQuestion: 2, answer: [true], isCorrect: true }
        ],
        isConnected: true
    },
    {
        id: '2',
        name: 'Disconnected Student',
        answers: [
            { idQuestion: 1, answer: ['Choice 2'], isCorrect: false },
            { idQuestion: 2, answer: [false], isCorrect: false }
        ],
        isConnected: false
    },
    {
        id: '3',
        name: 'Another Connected Student',
        answers: [
            { idQuestion: 1, answer: ['Choice 1'], isCorrect: true },
            { idQuestion: 2, answer: [true], isCorrect: true }
        ]
    }
];

const mockShowSelectedQuestion = jest.fn();

describe('LiveResultsV2', () => {
    // Test constants
    const NUMBER_OF_STUDENTS = 3;
    const NUMBER_OF_TABLE_ROWS = 5; // 1 header + 3 students + 1 footer
    const NUMBER_OF_CELLS_PER_DATA_ROW = 4; // 1 name + 2 questions + 1 grade
    const NUMBER_OF_PERFECT_SCORES = 2; // Students with 100%
    const NUMBER_OF_CORRECT_CHOICE_1 = 2; // Students with correct Choice 1
    const NUMBER_OF_CORRECT_TRUE_ANSWERS = 2; // Students with correct true answers
    test('renders the component with default quiz title', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        expect(screen.getByText('Résultats pour : Quiz')).toBeInTheDocument();
        expect(screen.getByRole('table')).toBeInTheDocument();
    });

    test('renders the component with custom quiz title', () => {
        const customTitle = 'Custom Quiz Title';
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
                quizTitle={customTitle}
            />
        );

        expect(screen.getByText(`Résultats pour : ${customTitle}`)).toBeInTheDocument();
    });

    test('toggles show usernames switch', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        expect(usernamesSwitch).toBeInTheDocument();

        // Initially usernames are hidden (shows ******)
        expect(screen.getAllByText('******')).toHaveLength(NUMBER_OF_STUDENTS);

        // Toggle on
        fireEvent.click(usernamesSwitch);
        expect(screen.getByText('Connected Student')).toBeInTheDocument();
        expect(screen.getByText('Disconnected Student')).toBeInTheDocument();
        expect(screen.getByText('Another Connected Student')).toBeInTheDocument();

        // Toggle off
        fireEvent.click(usernamesSwitch);
        expect(screen.getAllByText('******')).toHaveLength(NUMBER_OF_STUDENTS);
    });

    test('toggles show correct answers switch', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const answersSwitch = screen.getByLabelText('Afficher les réponses');
        expect(answersSwitch).toBeInTheDocument();

        // Initially shows icons (check marks and x marks)
        expect(document.querySelector('.fa-check')).toBeInTheDocument();
        expect(document.querySelector('.fa-circle-xmark')).toBeInTheDocument();

        // Toggle on - should show actual answers
        fireEvent.click(answersSwitch);
        expect(screen.getAllByText('Choice 1')).toHaveLength(NUMBER_OF_CORRECT_CHOICE_1); 
        expect(screen.getByText('Choice 2')).toBeInTheDocument();
        expect(screen.getAllByText('true')).toHaveLength(NUMBER_OF_CORRECT_TRUE_ANSWERS); 
        expect(screen.getByText('false')).toBeInTheDocument();

        // Toggle off - should show icons again
        fireEvent.click(answersSwitch);
        expect(document.querySelector('.fa-check')).toBeInTheDocument();
        expect(document.querySelector('.fa-circle-xmark')).toBeInTheDocument();
    });

    test('renders table with correct structure', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Check table exists
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

      
        const rows = screen.getAllByRole('row');
        expect(rows).toHaveLength(NUMBER_OF_TABLE_ROWS); 
    });

    test('renders switches with correct labels', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        expect(screen.getByLabelText('Afficher les noms')).toBeInTheDocument();
        expect(screen.getByLabelText('Afficher les réponses')).toBeInTheDocument();
    });

    test('passes disconnected students to table component', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable usernames to see the student names
        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        fireEvent.click(usernamesSwitch);

        // Check that disconnected student is rendered with correct styling
        const disconnectedStudent = screen.getByText('Disconnected Student');
        expect(disconnectedStudent).toBeInTheDocument();
        
        // Check that the disconnected student's row has the student-disconnected class
        const disconnectedRow = disconnectedStudent.closest('tr');
        expect(disconnectedRow).toHaveClass('student-disconnected');

        // Check that connected students don't have the class
        const connectedStudent1 = screen.getByText('Connected Student');
        const connectedRow1 = connectedStudent1.closest('tr');
        expect(connectedRow1).not.toHaveClass('student-disconnected');

        const connectedStudent2 = screen.getByText('Another Connected Student');
        const connectedRow2 = connectedStudent2.closest('tr');
        expect(connectedRow2).not.toHaveClass('student-disconnected');
    });

    test('renders all students in table rows', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable usernames to see student names
        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        fireEvent.click(usernamesSwitch);

        // Check that all student names are displayed
        expect(screen.getByText('Connected Student')).toBeInTheDocument();
        expect(screen.getByText('Disconnected Student')).toBeInTheDocument();
        expect(screen.getByText('Another Connected Student')).toBeInTheDocument();
    });

    test('applies student-disconnected class to disconnected students', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable usernames first
        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        fireEvent.click(usernamesSwitch);

        // Find the table rows
        const rows = screen.getAllByRole('row');

        // The disconnected student should have the student-disconnected class
        const disconnectedRow = rows.find(row =>
            row.textContent?.includes('Disconnected Student')
        );
        expect(disconnectedRow).toHaveClass('student-disconnected');

        // Connected students should not have the class
        const connectedRow1 = rows.find(row =>
            row.textContent?.includes('Connected Student')
        );
        expect(connectedRow1).not.toHaveClass('student-disconnected');

        const connectedRow2 = rows.find(row =>
            row.textContent?.includes('Another Connected Student')
        );
        expect(connectedRow2).not.toHaveClass('student-disconnected');
    });

    test('applies student-name class to all student names when showUsernames is true', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable usernames
        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        fireEvent.click(usernamesSwitch);

        // All student names should be wrapped in spans with student-name class
        const studentNameElements = screen.getAllByText(/Connected Student|Disconnected Student|Another Connected Student/);
        studentNameElements.forEach(element => {
            expect(element.closest('span')).toHaveClass('student-name');
        });
    });

    test('displays anonymous names when showUsernames is false', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Should show ****** instead of names
        const anonymousCells = screen.getAllByText('******');
        expect(anonymousCells).toHaveLength(NUMBER_OF_STUDENTS);
    });

    test('displays correct answer indicators when showCorrectAnswers is false', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Should show checkmarks for correct answers and X marks for incorrect
        const checkIcons = document.querySelectorAll('.fa-check');
        const xIcons = document.querySelectorAll('.fa-circle-xmark');

        expect(checkIcons.length).toBeGreaterThan(0);
        expect(xIcons.length).toBeGreaterThan(0);
    });

    test('displays actual answers when showCorrectAnswers is true', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable showing answers
        const answersSwitch = screen.getByLabelText('Afficher les réponses');
        fireEvent.click(answersSwitch);

        // Should show the actual answer text instead of icons
        expect(screen.getAllByText('Choice 1')).toHaveLength(NUMBER_OF_CORRECT_CHOICE_1); 
        expect(screen.getByText('Choice 2')).toBeInTheDocument();
        expect(screen.getAllByText('true')).toHaveLength(NUMBER_OF_CORRECT_TRUE_ANSWERS);
        expect(screen.getByText('false')).toBeInTheDocument();
    });

    test('displays student grades correctly', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Check that grades are displayed 
        expect(screen.getAllByText('100 %')).toHaveLength(NUMBER_OF_PERFECT_SCORES); 
        expect(screen.getByText('0 %')).toBeInTheDocument(); 
    });

    test('handles students with undefined isConnected property as connected', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        // Enable usernames
        const usernamesSwitch = screen.getByLabelText('Afficher les noms');
        fireEvent.click(usernamesSwitch);

        const rows = screen.getAllByRole('row');

        // Student with undefined isConnected should not have student-disconnected class
        const undefinedConnectedRow = rows.find(row =>
            row.textContent?.includes('Another Connected Student')
        );
        expect(undefinedConnectedRow).not.toHaveClass('student-disconnected');
    });

    test('renders correct number of question columns', () => {
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
            />
        );

        const rows = screen.getAllByRole('row');

        // Each row should have: 1 name column + maxQuestions (2) + 1 grade column = 4 cells
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) { 
                expect(cells).toHaveLength(NUMBER_OF_CELLS_PER_DATA_ROW); 
            }
        });
    });
});