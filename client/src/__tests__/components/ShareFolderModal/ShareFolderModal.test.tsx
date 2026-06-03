import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ShareFolderModal from '../../../components/ShareFolderModal/ShareFolderModal';
import ApiService from '../../../services/ApiService';
import { FolderType } from '../../../Types/FolderType';
import { QuizType } from '../../../Types/QuizType';

jest.mock('../../../services/ApiService');

const mockFolder: FolderType = {
    _id: 'folder-1',
    userId: 'user-1',
    title: 'Mon Dossier',
    created_at: '2025-01-01',
};

const mockQuizzes: QuizType[] = [
    {
        _id: 'q1',
        folderId: 'folder-1',
        folderName: 'Mon Dossier',
        userId: 'user-1',
        title: 'Quiz A',
        content: ['::Q1:: Question? {=Oui ~Non}'],
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        _id: 'q2',
        folderId: 'folder-1',
        folderName: 'Mon Dossier',
        userId: 'user-1',
        title: 'Quiz B',
        content: ['::Q2:: Autre? {=Vrai ~Faux}'],
        created_at: new Date(),
        updated_at: new Date(),
    },
];

const mockOnClose = jest.fn();

const renderModal = (open = true, folder: FolderType | null = mockFolder) =>
    render(<ShareFolderModal open={open} folder={folder} onClose={mockOnClose} />);

describe('ShareFolderModal', () => {
    let clipboardWriteMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        (ApiService.getFolderContent as jest.Mock).mockResolvedValue(mockQuizzes);
        clipboardWriteMock = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: clipboardWriteMock },
            configurable: true,
        });
    });

    it('does not render dialog when open is false', () => {
        renderModal(false);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows loading spinner while fetching', () => {
        (ApiService.getFolderContent as jest.Mock).mockReturnValue(new Promise(() => {}));
        renderModal();
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('shows quiz list after successful fetch', async () => {
        renderModal();
        await waitFor(() => {
            expect(screen.getByText('Quiz A')).toBeInTheDocument();
            expect(screen.getByText('Quiz B')).toBeInTheDocument();
        });
    });

    it('shows empty state when folder has no quizzes', async () => {
        (ApiService.getFolderContent as jest.Mock).mockResolvedValue([]);
        renderModal();
        await waitFor(() =>
            expect(screen.getByText(/ce dossier ne contient aucun quiz/i)).toBeInTheDocument()
        );
    });

    it('disables "Copier tous les liens" button when folder is empty', async () => {
        (ApiService.getFolderContent as jest.Mock).mockResolvedValue([]);
        renderModal();
        await waitFor(() =>
            expect(screen.getByRole('button', { name: /copier tous les liens/i })).toBeDisabled()
        );
    });

    it('shows error alert when API returns an error string', async () => {
        (ApiService.getFolderContent as jest.Mock).mockResolvedValue('Erreur serveur');
        renderModal();
        await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
        expect(screen.getByText('Erreur serveur')).toBeInTheDocument();
    });

    it('copies all share URLs to clipboard when "Copier tous les liens" is clicked', async () => {
        renderModal();
        await waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /copier tous les liens/i }));
        await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledTimes(1));
        const written = clipboardWriteMock.mock.calls[0][0] as string;
        expect(written).toContain('Quiz A :\n');
        expect(written).toContain('/teacher/share/q1');
        expect(written).toContain('Quiz B :\n');
        expect(written).toContain('/teacher/share/q2');
    });

    it('shows error feedback when clipboard is unavailable', async () => {
        clipboardWriteMock.mockRejectedValue(new Error('not allowed'));
        renderModal();
        await waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /copier tous les liens/i }));
        await waitFor(() =>
            expect(screen.getByText(/impossible de copier le lien/i)).toBeInTheDocument()
        );
    });

    it('copies single quiz URL when its copy icon is clicked', async () => {
        renderModal();
        await waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());
        const copyButtons = screen.getAllByRole('button', { name: /copier le lien de/i });
        fireEvent.click(copyButtons[0]);
        await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledTimes(1));
        const written = clipboardWriteMock.mock.calls[0][0] as string;
        expect(written).toContain('/teacher/share/q1');
        expect(written).not.toContain('/teacher/share/q2');
    });

    it('calls onClose when Fermer is clicked', async () => {
        renderModal();
        await waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('re-fetches when folder changes while modal is open', async () => {
        const { rerender } = renderModal();
        await waitFor(() => expect(ApiService.getFolderContent).toHaveBeenCalledWith('folder-1'));

        const otherFolder: FolderType = { _id: 'folder-2', userId: 'user-1', title: 'Autre', created_at: '2025-01-01' };
        (ApiService.getFolderContent as jest.Mock).mockResolvedValue([]);
        rerender(<ShareFolderModal open={true} folder={otherFolder} onClose={mockOnClose} />);

        await waitFor(() => expect(ApiService.getFolderContent).toHaveBeenCalledWith('folder-2'));
    });
});
