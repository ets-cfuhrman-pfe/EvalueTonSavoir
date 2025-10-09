import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResultsV2 from 'src/components/LiveResults/LiveResultsV2';
import { QuestionType } from 'src/Types/QuestionType';
import { StudentType, Answer } from 'src/Types/StudentType';
import { Socket } from 'socket.io-client';
import { BaseQuestion, parse } from 'gift-pegjs';

// Mock the LiveResultsTableV2 component
jest.mock('src/components/LiveResults/LiveResultsTable/LiveResultsTableV2', () => {
    return function MockLiveResultsTableV2({ students, questions, showCorrectAnswers, showSelectedQuestion: _showSelectedQuestion, showUsernames, selectedQuestionIndex }: any) {
        return (
            <div data-testid="live-results-table-v2">
                <div data-testid="students-count">{students.length}</div>
                <div data-testid="questions-count">{questions.length}</div>
                <div data-testid="show-correct-answers">{showCorrectAnswers.toString()}</div>
                <div data-testid="show-usernames">{showUsernames.toString()}</div>
                <div data-testid="selected-question-index">{selectedQuestionIndex || 'undefined'}</div>
            </div>
        );
    };
});

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
    new StudentType('Student 1', '1', 'TestRoom'),
    new StudentType('Student 2', '2', 'TestRoom', [
        new Answer(['Choice 3'], false, 1),
        new Answer([true], true, 2)
    ]),
    new StudentType('Student 3', '3', 'TestRoom', [
        new Answer(['Choice 1', 'Choice 2'], true, 1),
        new Answer([true], true, 2)
    ]),
];

const mockShowSelectedQuestion = jest.fn();

describe('LiveResultsV2', () => {
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
        expect(screen.getByTestId('live-results-table-v2')).toBeInTheDocument();
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

        // Initially false
        expect(screen.getByTestId('show-usernames')).toHaveTextContent('false');

        // Toggle on
        fireEvent.click(usernamesSwitch);
        expect(screen.getByTestId('show-usernames')).toHaveTextContent('true');

        // Toggle off
        fireEvent.click(usernamesSwitch);
        expect(screen.getByTestId('show-usernames')).toHaveTextContent('false');
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

        // Initially false
        expect(screen.getByTestId('show-correct-answers')).toHaveTextContent('false');

        // Toggle on
        fireEvent.click(answersSwitch);
        expect(screen.getByTestId('show-correct-answers')).toHaveTextContent('true');

        // Toggle off
        fireEvent.click(answersSwitch);
        expect(screen.getByTestId('show-correct-answers')).toHaveTextContent('false');
    });

    test('passes correct props to LiveResultsTableV2', () => {
        const selectedIndex = 1;
        render(
            <LiveResultsV2
                socket={mockSocket}
                questions={mockQuestions}
                showSelectedQuestion={mockShowSelectedQuestion}
                quizMode="teacher"
                students={mockStudents}
                selectedQuestionIndex={selectedIndex}
            />
        );

        expect(screen.getByTestId('students-count')).toHaveTextContent(mockStudents.length.toString());
        expect(screen.getByTestId('questions-count')).toHaveTextContent(mockQuestions.length.toString());
        expect(screen.getByTestId('selected-question-index')).toHaveTextContent(selectedIndex.toString());
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
});