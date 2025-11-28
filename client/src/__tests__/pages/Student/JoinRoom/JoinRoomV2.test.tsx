import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import JoinRoomV2 from 'src/pages/Student/JoinRoom/JoinRoomV2';
import webSocketService from 'src/services/WebsocketService';
import ApiService from 'src/services/ApiService';
import ValidationService from 'src/services/ValidationService';

// Mock dependencies
jest.mock('src/services/WebsocketService');
jest.mock('src/services/ApiService');
jest.mock('src/services/ValidationService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams()],
  useBeforeUnload: jest.fn(),
}));

jest.mock('src/components/StudentModeQuiz/StudentModeQuizV2', () => () => <div data-testid="student-mode-quiz">Student Mode Quiz</div>);
jest.mock('src/components/TeacherModeQuiz/TeacherModeQuizV2', () => () => <div data-testid="teacher-mode-quiz">Teacher Mode Quiz</div>);
jest.mock('src/components/DisconnectButton/DisconnectButton', () => ({ onReturn }: any) => (
  <button onClick={onReturn} data-testid="disconnect-button">Disconnect</button>
));
jest.mock('src/components/ValidatedTextField/ValidatedTextField', () => ({ onValueChange, initialValue, label }: any) => (
  <input
    data-testid={`input-${label}`}
    defaultValue={initialValue}
    onChange={(e) => onValueChange(e.target.value, true)}
  />
));
jest.mock('src/components/LoginContainer/LoginContainerV2', () => ({ children, title, error }: any) => (
  <div data-testid="login-container">
    <h1>{title}</h1>
    {error && <div data-testid="error-message">{error}</div>}
    {children}
  </div>
));

describe('JoinRoomV2 Component', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    connected: false,
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (webSocketService.connect as jest.Mock).mockReturnValue(mockSocket);
    (ApiService.getUsername as jest.Mock).mockReturnValue('TestUser');
    (ValidationService.validateField as jest.Mock).mockReturnValue({ isValid: true, errors: [] });
  });

  test('should render login form initially', () => {
    render(
      <MemoryRouter>
        <JoinRoomV2 />
      </MemoryRouter>
    );

    expect(screen.getByTestId('login-container')).toBeInTheDocument();
    expect(screen.getByTestId("input-Nom d'utilisateur")).toHaveValue('TestUser');
    expect(screen.getByTestId("input-Nom de la salle")).toBeInTheDocument();
  });

  test('should handle "io server disconnect" correctly', async () => {
    render(
      <MemoryRouter>
        <JoinRoomV2 />
      </MemoryRouter>
    );

    // Simulate socket connection
    const connectCallback = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')?.[1];
    expect(connectCallback).toBeDefined();

    // Trigger disconnect
    act(() => {
      connectCallback('io server disconnect');
    });

    await waitFor(() => {
      expect(webSocketService.disconnect).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/student/join-room-v2', { replace: true });
    });
  });

  test('should join room and show waiting screen', async () => {
    render(
      <MemoryRouter>
        <JoinRoomV2 />
      </MemoryRouter>
    );

    // Fill in room name
    const roomInput = screen.getByTestId("input-Nom de la salle");
    fireEvent.change(roomInput, { target: { value: 'ROOM1' } });

    // Click join button
    const joinButton = screen.getByText('Rejoindre');
    fireEvent.click(joinButton);

    expect(webSocketService.joinRoom).toHaveBeenCalledWith('ROOM1', 'TestUser');

    // Simulate join success
    const joinSuccessCallback = mockSocket.on.mock.calls.find(call => call[0] === 'join-success')?.[1];
    act(() => {
      joinSuccessCallback('ROOM1');
    });

    await waitFor(() => {
      expect(screen.getByText('Salle: ROOM1')).toBeInTheDocument();
      expect(screen.getByText('En attente que le professeur lance le questionnaire...')).toBeInTheDocument();
    });
  });
});
