import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareQuizModal from '../../../components/ShareQuizModal/ShareQuizModal.tsx';
import { QuizType } from '../../../Types/QuizType';
import '@testing-library/jest-dom';

describe('ShareQuizModal', () => {
  const mockQuiz: QuizType = {
    _id: '123',
    folderId: 'folder-123',
    folderName: 'Test Folder',
    userId: 'user-123',
    title: 'Test Quiz',
    content: ['Question 1', 'Question 2'],
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeAll(() => {
    // Properly mock the clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: jest.fn().mockImplementation(() => Promise.resolve()),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the share button', () => {
    render(<ShareQuizModal quiz={mockQuiz} />);
    expect(screen.getByLabelText('partager quiz')).toBeInTheDocument();
    expect(screen.getByTestId('ShareIcon')).toBeInTheDocument();
  });

  it('copies the quiz URL to clipboard when share button is clicked', async () => {
    render(<ShareQuizModal quiz={mockQuiz} />);
    const shareButton = screen.getByLabelText('partager quiz');
    
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${window.location.origin}/teacher/share/${mockQuiz._id}`
    );
    
    // Check for feedback dialog content
    expect(screen.getByText(/L'URL de partage pour le quiz/i)).toBeInTheDocument();
    expect(screen.getByText(mockQuiz.title)).toBeInTheDocument();
    expect(screen.getByText(/a été copiée\./i)).toBeInTheDocument();
  });

  it('shows error message when clipboard write fails', async () => {
    // Override the mock to reject
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard write failed'));
    
    render(<ShareQuizModal quiz={mockQuiz} />);
    const shareButton = screen.getByLabelText('partager quiz');
    
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(screen.getByText(/Une erreur est survenue lors de la copie de l'URL\./i)).toBeInTheDocument();
  });

  it('displays the quiz title in the success message', async () => {
    render(<ShareQuizModal quiz={mockQuiz} />);
    const shareButton = screen.getByLabelText('partager quiz');
    
    await act(async () => {
      fireEvent.click(shareButton);
    });
    
    expect(screen.getByText(mockQuiz.title)).toBeInTheDocument();
  });
});