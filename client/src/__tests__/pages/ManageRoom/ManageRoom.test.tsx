import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useNavigate, useParams } from 'react-router-dom';
import ManageRoom from 'src/pages/Teacher/ManageRoom/ManageRoom';
import { StudentType } from 'src/Types/StudentType';
import { QuizType } from 'src/Types/QuizType';
import webSocketService, { AnswerReceptionFromBackendType } from 'src/services/WebsocketService';
import ApiService from 'src/services/ApiService';
import { Socket } from 'socket.io-client';
import { RoomProvider } from 'src/pages/Teacher/ManageRoom/RoomContext';

jest.mock('src/services/WebsocketService');
jest.mock('src/services/ApiService');
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
    useParams: jest.fn(),
}));
jest.mock('src/pages/Teacher/ManageRoom/RoomContext');

jest.mock('qrcode.react', () => ({
    __esModule: true,
    QRCodeCanvas: ({ value }: { value: string }) => <div data-testid="qr-code">{value}</div>,
}));

const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
} as unknown as Socket;

const mockQuiz: QuizType = {
    _id: 'test-quiz-id',
    title: 'Test Quiz',
    content: ['::Q1:: Question 1 { =Answer1 ~Answer2 }', '::Q2:: Question 2 { =Answer1 ~Answer2 }'],
    folderId: 'folder-id',
    folderName: 'folder-name',
    userId: 'user-id',
    created_at: new Date(),
    updated_at: new Date(),
};

const mockStudents: StudentType[] = [
    { id: '1', name: 'Student 1', answers: [] },
    { id: '2', name: 'Student 2', answers: [] },
];

const mockAnswerData: AnswerReceptionFromBackendType = {
    answer: ['Answer1'],
    idQuestion: 1,
    idUser: '1',
    username: 'Student 1',
};

describe('ManageRoom', () => {
    const navigate = jest.fn();
    const useParamsMock = useParams as jest.Mock;
    const mockSetSelectedRoom = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useNavigate as jest.Mock).mockReturnValue(navigate);
        useParamsMock.mockReturnValue({ quizId: 'test-quiz-id', roomName: 'Test Room' });
        (ApiService.getQuiz as jest.Mock).mockResolvedValue(mockQuiz);
        (webSocketService.connect as jest.Mock).mockReturnValue(mockSocket);
        (RoomProvider as jest.Mock).mockReturnValue({
            selectedRoom: { id: '1', title: 'Test Room' },
            setSelectedRoom: mockSetSelectedRoom,
        });
    });

    test('prepares to launch quiz and fetches quiz data', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });
    
        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });
    
        await waitFor(() => {
            expect(ApiService.getQuiz).toHaveBeenCalledWith('test-quiz-id');
        });
    
        const launchButton = screen.getByText('Lancer');
        fireEvent.click(launchButton);
    
        const rythmeButton = screen.getByText('Rythme du professeur');
        fireEvent.click(rythmeButton);
    
        const secondLaunchButton = screen.getAllByText('Lancer');
        fireEvent.click(secondLaunchButton[1]);
    
        await waitFor(() => {
            expect(screen.getByText('Test Quiz')).toBeInTheDocument();
    
            const roomHeader = document.querySelector('h1');
            expect(roomHeader).toHaveTextContent('Salle : TEST ROOM');
    
            expect(screen.getByText('0/60')).toBeInTheDocument();
            expect(screen.getByText('Question 1/2')).toBeInTheDocument();
        });
    });
    
    test('handles create-success event', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });

        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });

        await waitFor(() => {
            expect(screen.getByText(/Salle\s*:\s*Test Room/i)).toBeInTheDocument();
        });
    });

    test('handles user-joined event', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });

        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });

        await act(async () => {
            const userJoinedCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'user-joined')[1];
            userJoinedCallback(mockStudents[0]);
        });

        await waitFor(() => {
            expect(screen.getByText('Student 1')).toBeInTheDocument();

        });

        const launchButton = screen.getByText('Lancer');
        fireEvent.click(launchButton);

        const rythmeButton = screen.getByText('Rythme du professeur');
        fireEvent.click(rythmeButton);

        const secondLaunchButton = screen.getAllByText('Lancer');
        fireEvent.click(secondLaunchButton[1]);

        await waitFor(() => {
            expect(screen.getByText('1/60')).toBeInTheDocument();

        });
    });

    test('handles next question', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });
    
        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });
    
        fireEvent.click(screen.getByText('Lancer'));
        fireEvent.click(screen.getByText('Rythme du professeur'));
        fireEvent.click(screen.getAllByText('Lancer')[1]);
    
        await waitFor(() => {
            screen.debug();
        });
    
        const nextQuestionButton = await screen.findByRole('button', { name: /Prochaine question/i });
        expect(nextQuestionButton).toBeInTheDocument();
    
        fireEvent.click(nextQuestionButton);
    
        await waitFor(() => {
            expect(screen.getByText('Question 2/2')).toBeInTheDocument();
        });
    });
    
    test('handles disconnect', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });

        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });

        const disconnectButton = screen.getByText('Quitter');
        fireEvent.click(disconnectButton);

        const confirmButton = screen.getAllByText('Confirmer');
        fireEvent.click(confirmButton[1]);

        await waitFor(() => {
            expect(webSocketService.disconnect).toHaveBeenCalled();
            expect(navigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
        });
    });

    test('handles submit-answer-room event', async () => {
        const consoleSpy = jest.spyOn(console, 'log');
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });
    
        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });
    
        const launchButton = screen.getByText('Lancer');
        fireEvent.click(launchButton);
    
        const rythmeButton = screen.getByText('Rythme du professeur');
        fireEvent.click(rythmeButton);
    
        const secondLaunchButton = screen.getAllByText('Lancer');
        fireEvent.click(secondLaunchButton[1]);
    
        await act(async () => {
            const userJoinedCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'user-joined')[1];
            userJoinedCallback(mockStudents[0]);
        });
    
        await act(async () => {
            const submitAnswerCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'submit-answer-room')[1];
            submitAnswerCallback(mockAnswerData);
        });
    
        await waitFor(() => {
            // console.info(consoleSpy.mock.calls);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Received answer from Student 1 for question 1: Answer1'
            );
        });
    
        consoleSpy.mockRestore();
    });

    test('vide la liste des étudiants après déconnexion', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });

        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });

        await act(async () => {
            const userJoinedCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'user-joined')[1];
            userJoinedCallback(mockStudents[0]);
        });

        const disconnectButton = screen.getByText('Quitter');
        fireEvent.click(disconnectButton);

        const confirmButton = screen.getAllByText('Confirmer');
        fireEvent.click(confirmButton[1]);

        await waitFor(() => {
            expect(screen.queryByText('Student 1')).not.toBeInTheDocument();
        });
    });

    test('terminates the quiz and navigates to teacher dashboard when the "Terminer le quiz" button is clicked', async () => {
        await act(async () => {
            render(
                <MemoryRouter>
                    <ManageRoom />
                </MemoryRouter>
            );
        });
    
        await act(async () => {
            const createSuccessCallback = (mockSocket.on as jest.Mock).mock.calls.find(call => call[0] === 'create-success')[1];
            createSuccessCallback('Test Room');
        });
    
        fireEvent.click(screen.getByText('Lancer'));
        fireEvent.click(screen.getByText('Rythme du professeur'));
        fireEvent.click(screen.getAllByText('Lancer')[1]);
    
        await waitFor(() => {
            expect(screen.getByText('Test Quiz')).toBeInTheDocument();
        });
    
        const finishQuizButton = screen.getByText('Terminer le quiz');
        fireEvent.click(finishQuizButton);
    
        await waitFor(() => {
            expect(navigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
        });
    });
    
    test("Affiche la modale QR Code lorsqu’on clique sur le bouton", async () => {
        render(<MemoryRouter><ManageRoom /></MemoryRouter>);
    
        const button = screen.getByRole('button', { name: /lien de participation/i });
        fireEvent.click(button);
    
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    
        expect(screen.getByRole('heading', { name: /Rejoindre la salle/i })).toBeInTheDocument();
        expect(screen.getByText(/Scannez ce QR code ou partagez le lien ci-dessous/i)).toBeInTheDocument();
        expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });
    
    test("Ferme la modale QR Code lorsqu’on clique sur le bouton Fermer", async () => {
        render(<MemoryRouter><ManageRoom /></MemoryRouter>);
    
        fireEvent.click(screen.getByRole('button', { name: /lien de participation/i }));
    
        await waitFor(() => {
            expect(screen.getByRole('dialog')).toBeInTheDocument();
        });
    
        fireEvent.click(screen.getByRole('button', { name: /fermer/i }));
    
        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
    
    test('Affiche le bon lien de participation', () => {
        render(<MemoryRouter><ManageRoom /></MemoryRouter>);
        
        fireEvent.click(screen.getByRole('button', { name: /lien de participation/i }));
        
        const roomUrl = `${window.location.origin}/student/join-room-v2?roomName=Test Room`;
        expect(screen.getByTestId('qr-code')).toHaveTextContent(roomUrl);
    });

    test('Vérifie que le QR code contient la bonne URL', () => {
        render(<MemoryRouter><ManageRoom /></MemoryRouter>);
        
        fireEvent.click(screen.getByRole('button', { name: /lien de participation/i }));
        
        const roomUrl = `${window.location.origin}/student/join-room-v2?roomName=Test Room`;
        expect(screen.getByTestId('qr-code')).toHaveTextContent(roomUrl);
    });
});

