import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadQuizModal from '../../../components/DownloadQuizModal/DownloadQuizModal';
import ApiService from '../../../services/ApiService';
import { QuizType } from '../../../Types/QuizType';

jest.mock('../../../services/ApiService');
jest.mock('jspdf', () => {
    return jest.fn().mockImplementation(() => ({
        addImage: jest.fn(),
        save: jest.fn(),
        addPage: jest.fn(),
    }));
});
jest.mock('html2canvas', () => jest.fn(() => Promise.resolve(document.createElement('canvas'))));
jest.mock('dompurify', () => ({
    sanitize: jest.fn((input) => input),
}));

const mockQuiz: QuizType = {
    _id: '123',
    title: 'Sample Quiz',
    content: ['::Question 1:: What is 2+2? {=4 ~3 ~5}'],
    folderId: 'folderId',
    folderName: 'folderName',
    userId: 'userId',
    created_at: new Date(),
    updated_at: new Date(),
};

describe('DownloadQuizModal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ApiService.getQuiz as jest.Mock).mockResolvedValue(mockQuiz);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('renders without crashing', () => {
        render(<DownloadQuizModal quiz={mockQuiz} />);
        expect(screen.getByRole('button', { name: /télécharger quiz/i })).toBeInTheDocument();
    });

    it('opens modal when download button is clicked', () => {
        render(<DownloadQuizModal quiz={mockQuiz} />);
        fireEvent.click(screen.getByRole('button', { name: /télécharger quiz/i }));
        expect(screen.getByText(/choisissez un format de téléchargement/i)).toBeInTheDocument();
    });

    it('closes modal when a format button is clicked', async () => {
        render(<DownloadQuizModal quiz={mockQuiz} />);
        fireEvent.click(screen.getByRole('button', { name: /télécharger quiz/i }));
        fireEvent.click(screen.getByRole('button', { name: /gift/i }));
        await waitFor(() =>
            expect(screen.queryByText(/choisissez un format de téléchargement/i)).not.toBeInTheDocument()
        );
    });

    it('handles error when quiz API fails', async () => {
        (ApiService.getQuiz as jest.Mock).mockRejectedValue(new Error('Quiz not found'));
        render(<DownloadQuizModal quiz={mockQuiz} />);
        fireEvent.click(screen.getByRole('button', { name: /télécharger quiz/i }));
        fireEvent.click(screen.getByRole('button', { name: /gift/i }));
        await waitFor(() => {
		expect(console.error).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({ message: expect.stringContaining("Quiz not found") })
		      );
        });
    });

});
