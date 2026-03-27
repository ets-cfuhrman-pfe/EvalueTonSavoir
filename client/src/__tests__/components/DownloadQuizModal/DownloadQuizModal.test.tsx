import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadQuizModal from '../../../components/DownloadQuizModal/DownloadQuizModal';
import ApiService from '../../../services/ApiService';
import { QuizType } from '../../../Types/QuizType';

jest.mock('../../../services/ApiService');
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
    let windowOpenSpy: jest.SpyInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        (ApiService.getQuiz as jest.Mock).mockResolvedValue(mockQuiz);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        const mockPrintWindow = {
            document: {
                open: jest.fn(),
                write: jest.fn(),
                close: jest.fn(),
                head: {
                    appendChild: jest.fn(),
                },
                body: {
                    innerHTML: '',
                    appendChild: jest.fn(),
                },
                documentElement: {
                    lang: '',
                },
                title: '',
                querySelectorAll: jest.fn().mockReturnValue([]),
            },
            focus: jest.fn(),
            print: jest.fn(),
            close: jest.fn(),
        } as unknown as Window;

        windowOpenSpy = jest.spyOn(globalThis, 'open').mockReturnValue(mockPrintWindow);
    });

    afterEach(() => {
        windowOpenSpy.mockRestore();
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

    it('opens print window when print with answers is clicked', async () => {
        render(<DownloadQuizModal quiz={mockQuiz} />);
        fireEvent.click(screen.getByRole('button', { name: /télécharger quiz/i }));
        fireEvent.click(screen.getByRole('button', { name: /imprimer avec réponses/i }));

        await waitFor(() => {
            expect(ApiService.getQuiz).toHaveBeenCalledWith('123');
            expect(globalThis.open).toHaveBeenCalled();
        });
    });

});
