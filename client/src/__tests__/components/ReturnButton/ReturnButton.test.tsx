import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useNavigate } from 'react-router-dom';
import ReturnButton from '../../../components/ReturnButton/ReturnButton.tsx'; // Adjust path as needed
import ApiService from '../../../services/ApiService';

// Mock react-router-dom's useNavigate
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

// Mock ApiService
jest.mock('../../../services/ApiService', () => ({
    createQuiz: jest.fn(),
    updateQuiz: jest.fn(),
}));

describe('ReturnButton Component', () => {
    const mockNavigate = jest.fn();
    const mockOnReturn = jest.fn();

    beforeEach(() => {
        // Reset mocks before each test
        jest.clearAllMocks();
        (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
        (ApiService.createQuiz as jest.Mock).mockResolvedValue({});
        (ApiService.updateQuiz as jest.Mock).mockResolvedValue({});
    });

    test('renders the button with "Retour" text when not saving', () => {
        render(<ReturnButton />);
        expect(screen.getByText('Retour')).toBeInTheDocument();
    });

    test('renders "Enregistrement..." text when saving', async () => {
        render(<ReturnButton quizTitle="Test Quiz" quizFolder="folder1" isNewQuiz />);
        fireEvent.click(screen.getByText('Retour'));
        expect(screen.getByText('Enregistrement...')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText('Enregistrement...')).not.toBeInTheDocument());
    });

    test('navigates to /teacher/dashboard by default when clicked', async () => {
        render(<ReturnButton />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard'));
    });

    test('calls onReturn prop instead of navigating when provided', async () => {
        render(<ReturnButton onReturn={mockOnReturn} />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(mockOnReturn).toHaveBeenCalled();
            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    test('disables button while saving', async () => {
        render(<ReturnButton quizTitle="Test Quiz" quizFolder="folder1" isNewQuiz />);
        const button = screen.getByText('Retour');
        fireEvent.click(button);
        expect(button).toBeDisabled();
        await waitFor(() => expect(button).not.toBeDisabled());
    });

    test('calls ApiService.createQuiz for new quiz with valid data', async () => {
        const props = {
            quizTitle: 'New Quiz',
            quizContent: ['Q1', 'Q2'],
            quizFolder: 'folder1',
            isNewQuiz: true,
        };
        render(<ReturnButton {...props} />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.createQuiz).toHaveBeenCalledWith('New Quiz', ['Q1', 'Q2'], 'folder1');
            expect(ApiService.updateQuiz).not.toHaveBeenCalled();
        });
    });

    test('calls ApiService.updateQuiz for existing quiz with valid data', async () => {
        const props = {
            quizId: 'quiz123',
            quizTitle: 'Updated Quiz',
            quizContent: ['Q1', 'Q2'],
            isNewQuiz: false,
        };
        render(<ReturnButton {...props} />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.updateQuiz).toHaveBeenCalledWith('quiz123', 'Updated Quiz', ['Q1', 'Q2']);
            expect(ApiService.createQuiz).not.toHaveBeenCalled();
        });
    });

    test('does not call ApiService if quizTitle is missing for new quiz', async () => {
        render(<ReturnButton quizFolder="folder1" isNewQuiz />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.createQuiz).not.toHaveBeenCalled();
            expect(ApiService.updateQuiz).not.toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
        });
    });

    test('does not call ApiService if quizId and quizTitle are missing for update', async () => {
        render(<ReturnButton />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.createQuiz).not.toHaveBeenCalled();
            expect(ApiService.updateQuiz).not.toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
        });
    });

    test('navigates even if ApiService.createQuiz fails', async () => {
        (ApiService.createQuiz as jest.Mock).mockRejectedValue(new Error('Save failed'));
        const props = {
            quizTitle: 'New Quiz',
            quizContent: ['Q1'],
            quizFolder: 'folder1',
            isNewQuiz: true,
        };
        render(<ReturnButton {...props} />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.createQuiz).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
        });
    });

    test('navigates even if ApiService.updateQuiz fails', async () => {
        (ApiService.updateQuiz as jest.Mock).mockRejectedValue(new Error('Update failed'));
        const props = {
            quizId: 'quiz123',
            quizTitle: 'Updated Quiz',
            quizContent: ['Q1'],
            isNewQuiz: false,
        };
        render(<ReturnButton {...props} />);
        fireEvent.click(screen.getByText('Retour'));
        await waitFor(() => {
            expect(ApiService.updateQuiz).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
        });
    });
});
