import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useParams } from 'react-router-dom';
import '@testing-library/jest-dom';
import ShareFolder from '../../../../pages/Teacher/Share/ShareFolder';
import ApiService from '../../../../services/ApiService';

jest.mock('../../../../services/ApiService');
jest.mock('src/components/ReturnButton/ReturnButtonV2', () => () => <div />);
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: jest.fn(),
    useNavigate: jest.fn(),
}));

const mockApi = ApiService as jest.Mocked<typeof ApiService>;
const mockNavigate = jest.fn();

const preview = {
    title: 'Physique',
    isOwner: false,
    quizzes: [
        { _id: 'q1', title: 'Forces' },
        { _id: 'q2', title: 'Énergie' },
    ],
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <ShareFolder />
        </MemoryRouter>
    );

describe('ShareFolder page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useParams as jest.Mock).mockReturnValue({ id: 'folder-1' });
        require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
        mockApi.isLoggedIn.mockReturnValue(true);
        mockApi.getSharedFolder.mockResolvedValue(preview);
        mockApi.receiveSharedFolder.mockResolvedValue({ newFolderId: 'new', title: 'Physique', quizCount: 2 });
    });

    it('shows loading state first', () => {
        mockApi.getSharedFolder.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('redirects to login when not authenticated', async () => {
        mockApi.isLoggedIn.mockReturnValue(false);
        renderPage();
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'));
        expect(mockApi.getSharedFolder).not.toHaveBeenCalled();
    });

    it('redirects to dashboard when no id is present', async () => {
        (useParams as jest.Mock).mockReturnValue({});
        renderPage();
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard'));
    });

    it('shows the shared folder title, quiz count and every quiz title', async () => {
        renderPage();
        expect(await screen.findByText('Importation du dossier : Physique')).toBeInTheDocument();
        expect(mockApi.getSharedFolder).toHaveBeenCalledWith('folder-1');
        expect(screen.getByText(/ses 2 quiz/)).toBeInTheDocument();
        expect(screen.getByText('Forces')).toBeInTheDocument();
        expect(screen.getByText('Énergie')).toBeInTheDocument();
        expect(screen.queryByText(/vous appartient déjà/)).not.toBeInTheDocument();
    });

    it('imports the whole folder in one click and returns to the dashboard', async () => {
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: /importer le dossier/i }));
        await waitFor(() => expect(mockApi.receiveSharedFolder).toHaveBeenCalledWith('folder-1'));
        expect(mockApi.receiveSharedFolder).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard'));
    });

    it('disables the import button while importing (no double import)', async () => {
        mockApi.receiveSharedFolder.mockReturnValue(new Promise(() => {}));
        renderPage();
        const button = await screen.findByRole('button', { name: /importer le dossier/i });
        fireEvent.click(button);
        await waitFor(() => expect(button).toBeDisabled());
        fireEvent.click(button);
        expect(mockApi.receiveSharedFolder).toHaveBeenCalledTimes(1);
    });

    it('shows the server error and stays on the page when import fails', async () => {
        mockApi.receiveSharedFolder.mockResolvedValue("Une erreur s'est produite lors de la copie du dossier.");
        renderPage();
        fireEvent.click(await screen.findByRole('button', { name: /importer le dossier/i }));
        expect(await screen.findByText(/erreur s'est produite lors de la copie/)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: /importer le dossier/i })).toBeEnabled();
    });

    it('shows an error and a way back when the shared folder does not exist', async () => {
        mockApi.getSharedFolder.mockResolvedValue("Aucun dossier portant cet identifiant n'a été trouvé.");
        renderPage();
        expect(await screen.findByText(/aucun dossier portant cet identifiant/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /importer le dossier/i })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /retour au tableau de bord/i }));
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
    });

    it('warns the owner that importing creates a copy', async () => {
        mockApi.getSharedFolder.mockResolvedValue({ ...preview, isOwner: true });
        renderPage();
        expect(await screen.findByText(/ce dossier vous appartient déjà/i)).toBeInTheDocument();
    });

    it('shows empty state for a folder without quizzes', async () => {
        mockApi.getSharedFolder.mockResolvedValue({ ...preview, quizzes: [] });
        renderPage();
        expect(await screen.findByText(/ce dossier ne contient aucun quiz/i)).toBeInTheDocument();
    });
});
