import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { readZip } from '../../../testUtils/readZip';
import ShareFolderModal from '../../../components/ShareFolderModal/ShareFolderModal';
import ApiService from '../../../services/ApiService';
import { downloadBlob } from '../../../utils/folderShare';
import { FolderType } from '../../../Types/FolderType';
import { QuizType } from '../../../Types/QuizType';

jest.mock('../../../services/ApiService');
jest.mock('../../../utils/folderShare', () => ({
    ...jest.requireActual('../../../utils/folderShare'),
    downloadBlob: jest.fn(),
}));

const mockFolder: FolderType = {
    _id: 'folder-1',
    userId: 'user-1',
    title: 'Mon Dossier',
    created_at: '2025-01-01',
};

const makeQuiz = (id: string, title: string, content: string[]): QuizType => ({
    _id: id,
    folderId: 'folder-1',
    folderName: 'Mon Dossier',
    userId: 'user-1',
    title,
    content,
    created_at: new Date(),
    updated_at: new Date(),
});

const mockQuizzes: QuizType[] = [
    makeQuiz('q1', 'Quiz A', ['::Q1:: Question? {=Oui ~Non}']),
    makeQuiz('q2', 'Quiz B', ['::Q2:: Autre? {=Vrai ~Faux}', '::Q3:: Encore? {TRUE}']),
];

const mockOnClose = jest.fn();

const renderModal = (open = true, folder: FolderType | null = mockFolder) =>
    render(<ShareFolderModal open={open} folder={folder} onClose={mockOnClose} />);

const listButton = () => screen.getByRole('button', { name: /copier la liste des quiz/i });
const folderLinkButton = () => screen.getByRole('button', { name: /copier le lien d'importation du dossier/i });
const zipButton = () => screen.getByRole('button', { name: /télécharger tous les quiz/i });

const waitForQuizzes = () => waitFor(() => expect(screen.getByText('Quiz A')).toBeInTheDocument());

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

    describe('loading', () => {
        it('does not render or fetch when open is false', () => {
            renderModal(false);
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
            expect(ApiService.getFolderContent).not.toHaveBeenCalled();
        });

        it('does not fetch when folder is null', () => {
            renderModal(true, null);
            expect(ApiService.getFolderContent).not.toHaveBeenCalled();
        });

        it('shows loading spinner while fetching, with actions disabled', () => {
            (ApiService.getFolderContent as jest.Mock).mockReturnValue(new Promise(() => {}));
            renderModal();
            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(listButton()).toBeDisabled();
            expect(folderLinkButton()).toBeDisabled();
            expect(zipButton()).toBeDisabled();
        });

        it('shows folder title and quiz list after successful fetch', async () => {
            renderModal();
            expect(screen.getByText(/partager le dossier/i)).toHaveTextContent('Mon Dossier');
            await waitForQuizzes();
            expect(screen.getByText('Quiz B')).toBeInTheDocument();
            expect(listButton()).toBeEnabled();
            expect(folderLinkButton()).toBeEnabled();
            expect(zipButton()).toBeEnabled();
        });

        it('shows empty state and disables every share action when folder has no quizzes', async () => {
            (ApiService.getFolderContent as jest.Mock).mockResolvedValue([]);
            renderModal();
            await waitFor(() => expect(screen.getByText(/ce dossier ne contient aucun quiz/i)).toBeInTheDocument());
            expect(listButton()).toBeDisabled();
            expect(folderLinkButton()).toBeDisabled();
            expect(zipButton()).toBeDisabled();
        });

        it('shows error alert and disables actions when API returns an error string', async () => {
            (ApiService.getFolderContent as jest.Mock).mockResolvedValue('Erreur serveur');
            renderModal();
            await waitFor(() => expect(screen.getByText('Erreur serveur')).toBeInTheDocument());
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
            expect(zipButton()).toBeDisabled();
        });

        it('stops loading and shows an error when the API call rejects', async () => {
            (ApiService.getFolderContent as jest.Mock).mockRejectedValue(new Error('network'));
            renderModal();
            await waitFor(() =>
                expect(screen.getByText(/impossible de charger le contenu du dossier/i)).toBeInTheDocument()
            );
            expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
        });

        it('re-fetches when folder changes while modal is open', async () => {
            const { rerender } = renderModal();
            await waitFor(() => expect(ApiService.getFolderContent).toHaveBeenCalledWith('folder-1'));

            const otherFolder: FolderType = { _id: 'folder-2', userId: 'user-1', title: 'Autre', created_at: '2025-01-01' };
            (ApiService.getFolderContent as jest.Mock).mockResolvedValue([]);
            rerender(<ShareFolderModal open={true} folder={otherFolder} onClose={mockOnClose} />);

            await waitFor(() => expect(ApiService.getFolderContent).toHaveBeenCalledWith('folder-2'));
            await waitFor(() => expect(screen.getByText(/ce dossier ne contient aucun quiz/i)).toBeInTheDocument());
        });

        it('ignores a late response from a previously selected folder', async () => {
            let resolveFirst: (v: QuizType[]) => void = () => {};
            (ApiService.getFolderContent as jest.Mock)
                .mockReturnValueOnce(new Promise((r) => { resolveFirst = r; }))
                .mockResolvedValueOnce([makeQuiz('z1', 'Quiz Z', [])]);

            const { rerender } = renderModal();
            const otherFolder: FolderType = { _id: 'folder-2', userId: 'user-1', title: 'Autre', created_at: '2025-01-01' };
            rerender(<ShareFolderModal open={true} folder={otherFolder} onClose={mockOnClose} />);
            await waitFor(() => expect(screen.getByText('Quiz Z')).toBeInTheDocument());

            await act(async () => resolveFirst(mockQuizzes));

            expect(screen.queryByText('Quiz A')).not.toBeInTheDocument();
            expect(screen.getByText('Quiz Z')).toBeInTheDocument();
        });
    });

    describe('option 1 – list of titles and links', () => {
        it('copies "title :\\nlink" for every quiz, separated by a blank line', async () => {
            renderModal();
            await waitForQuizzes();
            fireEvent.click(listButton());
            await waitFor(() => expect(clipboardWriteMock).toHaveBeenCalledTimes(1));
            const origin = window.location.origin;
            expect(clipboardWriteMock).toHaveBeenCalledWith(
                `Quiz A :\n${origin}/teacher/share/q1\n\nQuiz B :\n${origin}/teacher/share/q2`
            );
            expect(await screen.findByText(/liste des quiz copiée/i)).toBeInTheDocument();
        });

        it('copies a single quiz URL when its copy icon is clicked', async () => {
            renderModal();
            await waitForQuizzes();
            fireEvent.click(screen.getByRole('button', { name: 'Copier le lien de Quiz B' }));
            await waitFor(() =>
                expect(clipboardWriteMock).toHaveBeenCalledWith(`${window.location.origin}/teacher/share/q2`)
            );
            expect(await screen.findByText(/lien copié/i)).toBeInTheDocument();
        });

        it('shows error feedback when clipboard write is rejected', async () => {
            clipboardWriteMock.mockRejectedValue(new Error('not allowed'));
            renderModal();
            await waitForQuizzes();
            fireEvent.click(listButton());
            expect(await screen.findByText(/impossible de copier/i)).toBeInTheDocument();
        });

        it('falls back to execCommand when navigator.clipboard is unavailable', async () => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
            const execCommand = jest.fn().mockReturnValue(true);
            (document as any).execCommand = execCommand;
            renderModal();
            await waitForQuizzes();
            fireEvent.click(listButton());
            await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
            expect(await screen.findByText(/liste des quiz copiée/i)).toBeInTheDocument();
            expect(document.querySelector('textarea')).toBeNull();
        });

        it('shows error when the execCommand fallback fails', async () => {
            Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
            (document as any).execCommand = jest.fn().mockReturnValue(false);
            renderModal();
            await waitForQuizzes();
            fireEvent.click(listButton());
            expect(await screen.findByText(/impossible de copier/i)).toBeInTheDocument();
        });
    });

    describe('option 2 – single import link for the folder', () => {
        it('copies the folder import link', async () => {
            renderModal();
            await waitForQuizzes();
            fireEvent.click(folderLinkButton());
            await waitFor(() =>
                expect(clipboardWriteMock).toHaveBeenCalledWith(`${window.location.origin}/teacher/share-folder/folder-1`)
            );
            expect(await screen.findByText(/lien d'importation du dossier copié/i)).toBeInTheDocument();
        });
    });

    describe('option 3 – zip of GIFT files', () => {
        it('downloads "<folder>.zip" containing one .gift file per quiz with its questions', async () => {
            renderModal();
            await waitForQuizzes();
            fireEvent.click(zipButton());

            expect(downloadBlob).toHaveBeenCalledTimes(1);
            const [data, fileName, type] = (downloadBlob as jest.Mock).mock.calls[0];
            expect(fileName).toBe('Mon Dossier.zip');
            expect(type).toBe('application/zip');

            const files = readZip(data as Uint8Array);
            expect(Object.keys(files).sort()).toEqual(['Quiz A.gift', 'Quiz B.gift']);
            expect(files['Quiz A.gift']).toBe('::Q1:: Question? {=Oui ~Non}\n\n');
            expect(files['Quiz B.gift']).toBe('::Q2:: Autre? {=Vrai ~Faux}\n\n::Q3:: Encore? {TRUE}\n\n');
            expect(await screen.findByText(/archive .zip téléchargée/i)).toBeInTheDocument();
        });

        it('shows an error when the download fails', async () => {
            (downloadBlob as jest.Mock).mockImplementationOnce(() => { throw new Error('blocked'); });
            renderModal();
            await waitForQuizzes();
            fireEvent.click(zipButton());
            expect(await screen.findByText(/impossible de générer l'archive/i)).toBeInTheDocument();
        });
    });

    it('calls onClose when Fermer is clicked', async () => {
        renderModal();
        await waitForQuizzes();
        fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
});
