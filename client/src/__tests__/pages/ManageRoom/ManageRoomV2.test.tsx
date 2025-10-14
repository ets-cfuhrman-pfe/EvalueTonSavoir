import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ManageRoomV2 from 'src/pages/Teacher/ManageRoom/ManageRoomV2';
import ApiService from 'src/services/ApiService';
import webSocketService from 'src/services/WebsocketService';
import { QuizType } from 'src/Types/QuizType';
import { RoomType } from 'src/Types/RoomType';
import { calculateAnswerStatistics, getAnswerPercentage, getAnswerCount, getTotalStudentsWhoAnswered } from 'src/utils/answerStatistics';
import { Student, Answer } from 'src/Types/StudentType';


const questionDisplayV2MockProps: any[] = [];


// Mock dependencies
jest.mock('src/services/ApiService');
jest.mock('src/services/WebsocketService');
jest.mock('src/utils/answerStatistics');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('gift-pegjs', () => ({
  parse: jest.fn(),
}));
jest.mock('src/components/QuestionsDisplay/QuestionDisplayV2', () => {
  const React = require('react');
  const mockComponent = jest.fn((props) => {
    questionDisplayV2MockProps.push(props);
    return React.createElement(
      'div',
      { 'data-testid': 'question-display-v2' },
      props.showStatistics ? 'stats-on' : 'stats-off'
    );
  });
  return {
    __esModule: true,
    default: mockComponent,
  };
});
jest.mock('src/components/LiveResults/LiveResultsV2', () => {
  return function MockLiveResults({ students, quizTitle }: any) {
    return (
      <div data-testid="live-results">
        <div>Quiz: {quizTitle}</div>
        <div>Students: {students.length}</div>
      </div>
    );
  };
});
jest.mock('src/components/QuestionsDisplay/QuestionDisplay', () => {
  return function MockQuestionDisplay({ question }: any) {
    return (
      <div data-testid="question-display">
        Question: {question?.stem || 'No question'}
      </div>
    );
  };
});
jest.mock('src/components/QRCodeModal', () => {
  return function MockQRCodeModal({ open, onClose, roomName, roomUrl }: any) {
    return open ? (
      <div data-testid="qr-modal">
        <div>Room: {roomName}</div>
        <div>URL: {roomUrl}</div>
        <button onClick={onClose} data-testid="close-qr-modal">Close</button>
      </div>
    ) : null;
  };
});
jest.mock('src/components/LoadingCircle/LoadingCircle', () => {
  return function MockLoadingCircle({ text }: any) {
    return <div data-testid="loading-circle">{text}</div>;
  };
});

// Mock window.alert and window.confirm
const mockAlert = jest.fn();
const mockConfirm = jest.fn();
global.alert = mockAlert;
global.confirm = mockConfirm;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
  },
  writable: true,
});

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

describe('ManageRoomV2 Component', () => {
  const mockNavigate = jest.fn();
  const mockUseParams = jest.fn();
  const mockApiService = ApiService as jest.Mocked<typeof ApiService>;
  const mockWebSocketService = webSocketService as jest.Mocked<typeof webSocketService>;
  const mockParse = require('gift-pegjs').parse;

  // Mock data
  const mockQuiz: QuizType = {
    _id: 'quiz1',
    folderId: 'folder1',
    folderName: 'Test Folder',
    userId: 'user1',
    title: 'Test Quiz',
    content: ['Question 1?', 'Question 2?'],
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockRooms: RoomType[] = [
    { _id: 'room1', userId: 'user1', title: 'Room 1', created_at: '2024-01-01' },
    { _id: 'room2', userId: 'user1', title: 'Room 2', created_at: '2024-01-02' },
  ];

  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    questionDisplayV2MockProps.length = 0;
    mockAlert.mockClear();
    mockConfirm.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();

    // Setup default mocks
    mockUseParams.mockReturnValue({ quizId: 'quiz1' });
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    require('react-router-dom').useParams.mockImplementation(mockUseParams);

    mockApiService.isLoggedIn.mockReturnValue(true);
    mockApiService.getQuiz.mockResolvedValue(mockQuiz);
    mockApiService.getUserRooms.mockResolvedValue(mockRooms);

    mockWebSocketService.connect.mockReturnValue(mockSocket as any);
    mockWebSocketService.createRoom.mockImplementation(() => {});
    mockWebSocketService.nextQuestion.mockImplementation(() => {});
    mockWebSocketService.launchStudentModeQuiz.mockImplementation(() => {});
    mockWebSocketService.endQuiz.mockImplementation(() => {});
    mockWebSocketService.disconnect.mockImplementation(() => {});

    mockParse.mockReturnValue([
      { id: '1', stem: 'Test question 1?' },
      { id: '2', stem: 'Test question 2?' }
    ]);

    localStorageMock.getItem.mockReturnValue('room1');
  });

  const renderComponent = (quizId = 'quiz1') => {
    mockUseParams.mockReturnValue({ quizId });
    return render(
      <MemoryRouter>
        <ManageRoomV2 />
      </MemoryRouter>
    );
  };

  describe('Initial Rendering and Authentication', () => {
    test('should redirect to login if not authenticated', async () => {
      mockApiService.isLoggedIn.mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/login');
      });
    });

    test('should show loading while fetching quiz', () => {
      renderComponent();

      expect(screen.getByTestId('loading-circle')).toBeInTheDocument();
      expect(screen.getByText('Chargement du quiz...')).toBeInTheDocument();
    });

    test('should fetch quiz on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith('quiz1');
      });
    });

    test('should handle quiz not found error', async () => {
      mockApiService.getQuiz.mockResolvedValue(null as any);

      renderComponent();

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Le quiz quiz1 n\'a pas été trouvé')
        );
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
      });
    });

    test('should handle missing quiz ID', async () => {
      renderComponent('');

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Le quiz n\'a pas été spécifié')
        );
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
      });
    });

    test('should fetch user rooms on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserRooms).toHaveBeenCalled();
      });
    });
  });

  describe('Quiz Launch Configuration', () => {
    test('should display quiz launch options when no room is formatted', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Options de lancement du quiz')).toBeInTheDocument();
        expect(screen.getByText('Test Quiz')).toBeInTheDocument();
        expect(screen.getByText('2 question(s)')).toBeInTheDocument();
      });
    });

    test('should display room selection dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('1. Sélectionner une salle')).toBeInTheDocument();
        expect(screen.getByLabelText('Choisir une salle existante:')).toBeInTheDocument();
      });
    });

    test('should display quiz mode selection', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('2. Rythme du quiz')).toBeInTheDocument();
        expect(screen.getByText('Rythme du professeur')).toBeInTheDocument();
        expect(screen.getByText('Rythme de l\'étudiant')).toBeInTheDocument();
      });
    });

    test('should select room from dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room2' } });
        expect(roomSelect).toHaveValue('room2');
      });
    });

    test('should change quiz mode', async () => {
      renderComponent();

      await waitFor(() => {
        const studentModeRadio = screen.getByDisplayValue('student');
        fireEvent.click(studentModeRadio);
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('student')).toBeChecked();
      });
    });

    test('should disable launch button when no room selected', async () => {
      localStorageMock.getItem.mockReturnValue(null); // No saved room
      mockApiService.getUserRooms.mockResolvedValue([]); // No rooms available
      renderComponent();

      await waitFor(() => {
        const launchButtons = screen.getAllByText('Lancer le quiz');
        expect(launchButtons[0]).toBeDisabled();
      });
    });

    test('should enable launch button when room is selected', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButtons = screen.getAllByText('Lancer le quiz');
        expect(launchButtons[0]).not.toBeDisabled();
      });
    });
  });

  describe('WebSocket Integration', () => {
    test('should create WebSocket room on launch', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      await waitFor(() => {
        expect(mockWebSocketService.connect).toHaveBeenCalled();
      });

      // Simulate the connect event to trigger createRoom
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectCallback) {
        connectCallback();
      }

      await waitFor(() => {
        expect(mockWebSocketService.createRoom).toHaveBeenCalled();
      });
    });

    test('should handle WebSocket connection error', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      // Simulate connection error
      const connectErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];

      if (connectErrorCallback) {
        connectErrorCallback(new Error('Connection failed'));
      }

      await waitFor(() => {
        expect(screen.getByText('Erreur lors de la connexion... Veuillez réessayer')).toBeInTheDocument();
      });
    });

    test('should handle user joined event', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      // Simulate user joined
      const userJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-joined'
      )?.[1];

      if (userJoinedCallback) {
        userJoinedCallback(new Student('John Doe', 'student1', 'TestRoom'));
      }

      jest.runAllTimers();

      await waitFor(() => {
  expect(screen.getByText(/0\/1 étudiants? ont répondu/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Quiz Modes', () => {
    test('should launch quiz in teacher mode', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const teacherModeRadio = screen.getByDisplayValue('teacher');
        fireEvent.click(teacherModeRadio);
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      // Simulate the connect event and wait for auto-launch
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectCallback) {
        connectCallback();
      }

      await waitFor(() => {
        expect(mockWebSocketService.nextQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            isLaunch: true
          })
        );
      }, { timeout: 2000 });
    });

    test('should launch quiz in student mode', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const studentModeRadio = screen.getByDisplayValue('student');
        fireEvent.click(studentModeRadio);
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      // Simulate the connect event and wait for auto-launch
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectCallback) {
        connectCallback();
      }

      await waitFor(() => {
        expect(mockWebSocketService.launchStudentModeQuiz).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });

  describe('Error Handling', () => {
    test('should handle room fetch error', async () => {
      mockApiService.getUserRooms.mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Options de lancement du quiz')).toBeInTheDocument();
      });
    });

    test('should prevent launching when no room is selected', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: '' } });
      });

      // Wait for the button to be disabled when no room is selected
      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        expect(launchButton).toBeDisabled();
      });
    });

    test('should handle invalid room selection', async () => {
     
      mockApiService.getUserRooms.mockResolvedValue([]);
      localStorageMock.getItem.mockReturnValue('nonexistent-room');
      
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });


      const roomSelect = screen.getByRole('combobox');
      
      // Manually trigger a change event with a non-existent room ID
      Object.defineProperty(roomSelect, 'value', { 
        value: 'nonexistent-room', 
        writable: true 
      });
      
      // Dispatch a change event to update the component state
      fireEvent.change(roomSelect, { target: { value: 'nonexistent-room' } });
      
      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      expect(mockAlert).toHaveBeenCalledWith('Salle non trouvée');
    });

    test('should show reconnect button on connection error', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      // Simulate connection error
      const connectErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];

      if (connectErrorCallback) {
        connectErrorCallback(new Error('Connection failed'));
      }

      await waitFor(() => {
        const reconnectButton = screen.getByText('Reconnecter');
        expect(reconnectButton).toBeInTheDocument();
        
        fireEvent.click(reconnectButton);
        expect(mockWebSocketService.connect).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Local Storage Integration', () => {
    test('should save selected room to localStorage', async () => {
      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room2' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('selectedRoomId', 'room2');
    });

    test('should load previously selected room from localStorage', async () => {
      localStorageMock.getItem.mockReturnValue('room2');

      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        expect(roomSelect).toHaveValue('room2');
      });
    });
  });

  describe('Quiz Content Validation', () => {
    test('should handle empty quiz content', async () => {
      const emptyQuiz = { ...mockQuiz, content: [] };
      mockApiService.getQuiz.mockResolvedValue(emptyQuiz);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('0 question(s)')).toBeInTheDocument();
      });
    });

    test('should handle quiz with invalid questions', async () => {
      mockParse.mockImplementation(() => {
        throw new Error('Invalid question format');
      });

      renderComponent();

      await waitFor(() => {
        const roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });

      await waitFor(() => {
        const launchButton = screen.getAllByText('Lancer le quiz')[0];
        fireEvent.click(launchButton);
      });

      await waitFor(() => {
        expect(mockWebSocketService.connect).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels for buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Retour au tableau de bord')).toBeInTheDocument();
        expect(screen.getAllByText('Lancer le quiz')).toHaveLength(2);
      });
    });

    test('should have proper form labels', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByLabelText('Choisir une salle existante:')).toBeInTheDocument();
        expect(screen.getByText('Rythme du professeur')).toBeInTheDocument();
        expect(screen.getByText('Rythme de l\'étudiant')).toBeInTheDocument();
      });
    });
  });

  describe('Afficher progression button', () => {
    test('should toggle statistics visibility and update question display props', async () => {
      renderComponent();

      await screen.findByText('Options de lancement du quiz');

      const roomSelect = screen.getByRole('combobox');
      fireEvent.change(roomSelect, { target: { value: 'room1' } });

      const launchButtons = screen.getAllByText('Lancer le quiz');
      fireEvent.click(launchButtons[0]);

      expect(mockWebSocketService.connect).toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await screen.findByTestId('question-display-v2');

      const showProgressButton = await screen.findByRole('button', {
        name: /Afficher progression/i,
      });

      expect(screen.getByTestId('question-display-v2')).toHaveTextContent('stats-off');

      fireEvent.click(showProgressButton);

      const hideProgressButton = await screen.findByRole('button', {
        name: /Masquer progression/i,
      });

      expect(screen.getByTestId('question-display-v2')).toHaveTextContent('stats-on');
      expect(questionDisplayV2MockProps.some((props) => props.showStatistics)).toBe(true);

      fireEvent.click(hideProgressButton);

      await screen.findByRole('button', {
        name: /Afficher progression/i,
      });
      expect(screen.getByRole('button', { name: /Afficher progression/i })).toBeInTheDocument();
      expect(screen.getByTestId('question-display-v2')).toHaveTextContent('stats-off');
      expect(questionDisplayV2MockProps.at(-1)?.showStatistics).toBe(false);
    });

    test('should pass correct student data to QuestionDisplayV2 for statistics calculation', async () => {
      renderComponent();

      await screen.findByText('Options de lancement du quiz');

      const roomSelect = screen.getByRole('combobox');
      fireEvent.change(roomSelect, { target: { value: 'room1' } });

      const launchButtons = screen.getAllByText('Lancer le quiz');
      fireEvent.click(launchButtons[0]);

      // Simulate students joining and answering
      const userJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-joined'
      )?.[1];

      if (userJoinedCallback) {
        userJoinedCallback({ id: 'student1', name: 'John Doe', room: 'TestRoom', answers: [], isConnected: true });
        userJoinedCallback({ id: 'student2', name: 'Jane Smith', room: 'TestRoom', answers: [], isConnected: true });
      }

      // Simulate answer submissions
      const submitAnswerCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'submit-answer-room'
      )?.[1];

      if (submitAnswerCallback) {
        submitAnswerCallback({
          userId: 'student1',
          idQuestion: 1,
          answer: ['Choice A'],
          timestamp: Date.now()
        });
        submitAnswerCallback({
          userId: 'student2', 
          idQuestion: 1,
          answer: ['Choice B'],
          timestamp: Date.now()
        });
      }

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await screen.findByTestId('question-display-v2');

      const showProgressButton = await screen.findByRole('button', {
        name: /Afficher progression/i,
      });

      fireEvent.click(showProgressButton);

      // Verify that students array is passed to QuestionDisplayV2
      const latestProps = questionDisplayV2MockProps.at(-1);
      expect(latestProps).toHaveProperty('students');
      expect(latestProps.students).toHaveLength(2);
      expect(latestProps.showStatistics).toBe(true);
    });

    test('should display student answer count when students have answered', async () => {
      renderComponent();

      await screen.findByText('Options de lancement du quiz');

      const roomSelect = screen.getByRole('combobox');
      fireEvent.change(roomSelect, { target: { value: 'room1' } });

      const launchButtons = screen.getAllByText('Lancer le quiz');
      fireEvent.click(launchButtons[0]);

      // Simulate students joining
      const userJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-joined'
      )?.[1];

      if (userJoinedCallback) {
        userJoinedCallback({ id: 'student1', name: 'John', room: 'TestRoom', answers: [{ idQuestion: 2, answer: ['A'], isCorrect: true }], isConnected: true });
        userJoinedCallback({ id: 'student2', name: 'Jane', room: 'TestRoom', answers: [{ idQuestion: 2, answer: ['B'], isCorrect: false }], isConnected: true });
        userJoinedCallback({ id: 'student3', name: 'Bob', room: 'TestRoom', answers: [], isConnected: true }); // No answer yet
      }

      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Should show that 2 out of 3 students answered
      await waitFor(() => {
        expect(screen.getByText(/2\/3 étudiants? ont répondu/)).toBeInTheDocument();
      });
    });

    test('should update student count dynamically as students join and answer', async () => {
      renderComponent();

      await screen.findByText('Options de lancement du quiz');

      const roomSelect = screen.getByRole('combobox');
      fireEvent.change(roomSelect, { target: { value: 'room1' } });

      const launchButtons = screen.getAllByText('Lancer le quiz');
      fireEvent.click(launchButtons[0]);

      // Simulate the connect event to trigger quiz launch
      const connectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      if (connectCallback) {
        connectCallback();
      }

      // Initially no students
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Add one student who already has answered the current question (question 2)
      const userJoinedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'user-joined'
      )?.[1];

      if (userJoinedCallback) {
        userJoinedCallback({ 
          id: 'student1', 
          name: 'John', 
          answers: [{ idQuestion: 2, answer: ['Choice A'], isCorrect: true }] 
        });
      }

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      // Should now show 1/1 students answered
      await waitFor(() => {
        expect(screen.getByText(/1\/1 étudiants? ont répondu/)).toBeInTheDocument();
      });
    });
  });

  describe('Answer Statistics Features', () => {
    const mockStudents: Student[] = [
      new Student('John Doe', 'student1', 'TestRoom', [new Answer(['Choice A'], true, 1)]),
      new Student('Jane Smith', 'student2', 'TestRoom', [new Answer(['Choice B'], false, 1)]),
      new Student('Bob Johnson', 'student3', 'TestRoom', [new Answer(['Choice A'], true, 1)]),
      new Student('Alice Brown', 'student4', 'TestRoom') // No answer
    ];

    beforeEach(() => {
      // Mock the answer statistics functions
      (calculateAnswerStatistics as jest.Mock).mockImplementation((_students, _questionId) => ({
        'Choice A': { count: 2, percentage: 67 },
        'Choice B': { count: 1, percentage: 33 }
      }));
      
      (getAnswerPercentage as jest.Mock).mockImplementation((stats, choice) => 
        stats[choice]?.percentage || 0
      );
      
      (getAnswerCount as jest.Mock).mockImplementation((stats, choice) => 
        stats[choice]?.count || 0
      );
      
      (getTotalStudentsWhoAnswered as jest.Mock).mockReturnValue(3);
    });

    test('should calculate answer statistics correctly', () => {
      const stats = calculateAnswerStatistics(mockStudents, 1);
      
      expect(stats).toEqual({
        'Choice A': { count: 2, percentage: 67 },
        'Choice B': { count: 1, percentage: 33 }
      });
    });

    test('should get correct answer percentage', () => {
      const stats = {
        'Choice A': { count: 2, percentage: 67 },
        'Choice B': { count: 1, percentage: 33 }
      };
      
      expect(getAnswerPercentage(stats, 'Choice A')).toBe(67);
      expect(getAnswerPercentage(stats, 'Choice B')).toBe(33);
      expect(getAnswerPercentage(stats, 'Choice C')).toBe(0);
    });

    test('should get correct answer count', () => {
      const stats = {
        'Choice A': { count: 2, percentage: 67 },
        'Choice B': { count: 1, percentage: 33 }
      };
      
      expect(getAnswerCount(stats, 'Choice A')).toBe(2);
      expect(getAnswerCount(stats, 'Choice B')).toBe(1);
      expect(getAnswerCount(stats, 'Choice C')).toBe(0);
    });

    test('should get total students who answered correctly', () => {
      expect(getTotalStudentsWhoAnswered(mockStudents, 1)).toBe(3);
    });

    test('should handle empty student array', () => {
      (calculateAnswerStatistics as jest.Mock).mockReturnValue({});
      (getTotalStudentsWhoAnswered as jest.Mock).mockReturnValue(0);
      
      const stats = calculateAnswerStatistics([], 1);
      const total = getTotalStudentsWhoAnswered([], 1);
      
      expect(stats).toEqual({});
      expect(total).toBe(0);
    });

    test('should handle students with no answers', () => {
      const studentsNoAnswers: Student[] = [
        new Student('John', 'student1', 'TestRoom'),
        new Student('Jane', 'student2', 'TestRoom')
      ];
      
      (calculateAnswerStatistics as jest.Mock).mockReturnValue({});
      (getTotalStudentsWhoAnswered as jest.Mock).mockReturnValue(0);
      
      const stats = calculateAnswerStatistics(studentsNoAnswers, 1);
      const total = getTotalStudentsWhoAnswered(studentsNoAnswers, 1);
      
      expect(stats).toEqual({});
      expect(total).toBe(0);
    });
  });
});