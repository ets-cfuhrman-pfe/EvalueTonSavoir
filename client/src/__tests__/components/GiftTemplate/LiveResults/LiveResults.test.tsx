import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import LiveResults from 'src/components/LiveResults/LiveResults';
import { QuestionType } from 'src/Types/QuestionType';
import { Socket } from 'socket.io-client';
import { StudentType } from 'src/Types/StudentType';
import { BaseQuestion, parse } from 'gift-pegjs';

const mockGiftQuestions = parse(
    `::Sample Question 1:: Sample Question 1 {=Answer 1 ~Answer 2}
    
    ::Sample Question 2:: Sample Question 2 {T}`);

const mockSocket: Socket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
} as unknown as Socket;

const mockQuestions: QuestionType[] = mockGiftQuestions.map((question, index) => {
    if (question.type !== "Category")
        question.id = (index + 1).toString();
    const newMockQuestion = question;
    return { question: newMockQuestion as BaseQuestion };
});

const mockStudents: StudentType[] = [
    { id: "1", name: 'Student 1', answers: [{ idQuestion: 1, answer: 'Answer 1', isCorrect: true }] },
    { id: "2", name: 'Student 2', answers: [{ idQuestion: 2, answer: 'Answer 2', isCorrect: false }] },
];

const mockShowSelectedQuestion = jest.fn();

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
    mockStudents.forEach((student) => {
        const grade = student.answers.filter(answer => answer.isCorrect).length / mockQuestions.length * 100;
        const gradeElements = screen.getAllByText(`${grade.toFixed()} %`);
        expect(gradeElements.length).toBeGreaterThan(0);});
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

test.skip('toggles the visibility of content when the arrow button is clicked', () => {
    render(<LiveResults
        socket={null}
        questions={mockQuestions}
        showSelectedQuestion={mockShowSelectedQuestion}
        quizMode="teacher"
        students={mockStudents}
    />);
    const toggleSwitch = screen.getByTestId("liveResults-visibility-switch");
    fireEvent.click(toggleSwitch);
    expect(toggleSwitch).toBeInTheDocument();

    expect(toggleSwitch).toBeChecked();
    expect(screen.queryByText('Afficher les noms')).toBeInTheDocument();
    expect(screen.queryByText('Afficher les réponses')).toBeInTheDocument();
    expect(screen.queryByTestId('table-container')).toBeInTheDocument();


    fireEvent.click(toggleSwitch);

    expect(toggleSwitch).not.toBeChecked();
    expect(screen.queryByText('Afficher les noms')).not.toBeInTheDocument();
    expect(screen.queryByText('Afficher les réponses')).not.toBeInTheDocument();
    expect(screen.queryByTestId('table-container')).not.toBeInTheDocument();

    fireEvent.click(toggleSwitch);
    expect(screen.queryByText('Afficher les noms')).toBeInTheDocument();
    expect(screen.queryByText('Afficher les réponses')).toBeInTheDocument();
    expect(screen.queryByTestId('table-container')).toBeInTheDocument();
});
