// Importez le type UserType s'il n'est pas déjà importé
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentWaitPage from 'src/components/StudentWaitPage/StudentWaitPage';
import { Student } from '../../../Types/StudentType';

describe('StudentWaitPage Component', () => {
    const mockUsers: Student[] = [
        new Student('User1', '1', 'TestRoom'),
        new Student('User2', '2', 'TestRoom'),
        new Student('User3', '3', 'TestRoom'),
    ];

    const mockProps = {
        students: mockUsers,
        launchQuiz: jest.fn(),
        roomName: 'Test Room',
        setQuizMode: jest.fn(),
        setIsRoomSelectionVisible: jest.fn()
    };

    test('renders StudentWaitPage with correct content', () => {
        render(<StudentWaitPage {...mockProps} />);

        //expect(screen.getByText(/Test Room/)).toBeInTheDocument();

        const launchButton = screen.getByRole('button', { name: /Lancer/i });
        expect(launchButton).toBeInTheDocument();

        mockUsers.forEach((user) => {
            expect(screen.getByText(user.name)).toBeInTheDocument();
        });
    });

    test('clicking on "Lancer" button opens LaunchQuizDialog', () => {
        render(<StudentWaitPage {...mockProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Lancer/i }));

        expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
});
