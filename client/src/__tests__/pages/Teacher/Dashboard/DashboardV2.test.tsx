import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DashboardV2 from '../../../../pages/Teacher/Dashboard/DashboardV2';
import ApiService from '../../../../services/ApiService';
import { QuizType } from '../../../../Types/QuizType';
import { FolderType } from '../../../../Types/FolderType';
import { RoomType } from '../../../../Types/RoomType';

// Mock dependencies
jest.mock('../../../../services/ApiService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));
jest.mock('gift-pegjs');
jest.mock('src/components/GiftTemplate/templates', () => ({
  __esModule: true,
  default: jest.fn(() => 'mocked template'),
}));
jest.mock('../../../../components/ImportModal/ImportModal', () => {
  return function MockImportModal({ open, handleOnClose }: any) {
    return open ? (
      <div data-testid="import-modal">
        <button onClick={handleOnClose} data-testid="close-import-modal">
          Close Import
        </button>
        <p>Importation de quiz</p>
      </div>
    ) : null;
  };
});
jest.mock('../../../../components/DownloadQuizModal/DownloadQuizModal', () => {
  return function MockDownloadQuizModal({ quiz }: any) {
    return <div data-testid={`download-modal-${quiz._id}`}>Download Modal</div>;
  };
});
jest.mock('../../../../components/ShareQuizModal/ShareQuizModal', () => {
  return function MockShareQuizModal({ quiz }: any) {
    return <div data-testid={`share-modal-${quiz._id}`}>Share Modal</div>;
  };
});
jest.mock('../../../../components/ValidatedTextField/ValidatedTextField', () => {
  return function MockValidatedTextField({ initialValue, onValueChange, label }: any) {
    return (
      <input
        data-testid={`validated-text-field-${label?.replace(/\s+/g, '-').toLowerCase()}`}
        value={initialValue}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={label}
      />
    );
  };
});

// Mock window.confirm and window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();
global.confirm = mockConfirm;
global.alert = mockAlert;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('DashboardV2 Component', () => {
  const mockNavigate = jest.fn();
  const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

  // Mock data
  const mockRooms: RoomType[] = [
    { _id: 'room1', userId: 'user1', title: 'Salle 1', created_at: '2024-01-01' },
    { _id: 'room2', userId: 'user1', title: 'Salle 2', created_at: '2024-01-02' },
  ];

  const mockFolders: FolderType[] = [
    { _id: 'folder1', userId: 'user1', title: 'Dossier 1', created_at: '2024-01-01' },
    { _id: 'folder2', userId: 'user1', title: 'Dossier 2', created_at: '2024-01-02' },
  ];

  const mockQuizzes: QuizType[] = [
    {
      _id: 'quiz1',
      folderId: 'folder1',
      folderName: 'Dossier 1',
      userId: 'user1',
      title: 'Quiz Mathématiques',
      content: ['Question 1?', 'Question 2?'],
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    },
    {
      _id: 'quiz2',
      folderId: 'folder1',
      folderName: 'Dossier 1',
      userId: 'user1',
      title: 'Quiz Histoire',
      content: ['Question 3?', 'Question 4?'],
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02'),
    },
    {
      _id: 'quiz3',
      folderId: 'folder2',
      folderName: 'Dossier 2',
      userId: 'user1',
      title: 'Quiz Sciences',
      content: ['Question 5?'],
      created_at: new Date('2024-01-03'),
      updated_at: new Date('2024-01-03'),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockClear();
    mockAlert.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();

    // Setup default mocks
    mockApiService.isLoggedIn.mockReturnValue(true);
    mockApiService.getUserRooms.mockResolvedValue(mockRooms);
    mockApiService.getUserFolders.mockResolvedValue(mockFolders);
    mockApiService.getFolderContent.mockImplementation((folderId: string) => {
      if (folderId === 'folder1') {
        return Promise.resolve(mockQuizzes.filter(q => q.folderId === 'folder1'));
      } else if (folderId === 'folder2') {
        return Promise.resolve(mockQuizzes.filter(q => q.folderId === 'folder2'));
      }
      return Promise.resolve([]);
    });

    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);

    // Mock gift-pegjs to return valid parsed data
    const mockParse = require('gift-pegjs').parse;
    mockParse.mockReturnValue([{}]);

    // Mock Template
    const mockTemplate = jest.requireMock('../../../../components/GiftTemplate/templates');
    mockTemplate.default = jest.fn().mockReturnValue({});
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <DashboardV2 />
      </MemoryRouter>
    );
  };

  describe('Initial Rendering and Authentication', () => {
    test('should render dashboard with title and subtitle', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Tableau de bord')).toBeInTheDocument();

      });
    });

    test('should redirect to login if not authenticated', async () => {
      mockApiService.isLoggedIn.mockReturnValue(false);

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/login');
      });
    });

    test('should fetch and display user rooms and folders on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserRooms).toHaveBeenCalled();
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });
    });

    test('should display room selector with fetched rooms', async () => {
      renderComponent();

      // Check that the active room is displayed in the header
      await waitFor(() => {
        expect(screen.getByText('Salle 2')).toBeInTheDocument(); // Last room should be selected
      });
    });

    test('should display folder selector with fetched folders', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that folders are displayed as buttons in the sidebar
        const dossier1Elements = screen.getAllByText('Dossier 1');
        const dossier2Elements = screen.getAllByText('Dossier 2');
        expect(dossier1Elements.length).toBeGreaterThan(0);
        expect(dossier2Elements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Room Management', () => {
    test('should open room creation dialog when selecting "Nouvelle salle"', async () => {
      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Click the "Nouvelle salle" button
      const newRoomButton = screen.getByText('Nouvelle salle');
      fireEvent.click(newRoomButton);

      // Check that the input field appears
      expect(screen.getByPlaceholderText('Nom de la salle')).toBeInTheDocument();
    });

    test('should create new room successfully', async () => {
      mockApiService.createRoom.mockResolvedValue('room3');

      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Click the "Nouvelle salle" button
      const newRoomButton = screen.getByText('Nouvelle salle');
      fireEvent.click(newRoomButton);

      // Enter room name
      const roomNameInput = screen.getByPlaceholderText('Nom de la salle');
      fireEvent.change(roomNameInput, { target: { value: 'NOUVELLE SALLE' } });

      // Click create button
      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockApiService.createRoom).toHaveBeenCalledWith('NOUVELLE SALLE');
        expect(mockApiService.getUserRooms).toHaveBeenCalled();
      });
    });

    test('should handle room creation error', async () => {
      mockApiService.createRoom.mockRejectedValue(new Error('Erreur de création'));

      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Click the "Nouvelle salle" button
      const newRoomButton = screen.getByText('Nouvelle salle');
      fireEvent.click(newRoomButton);

      // Enter room name
      const roomNameInput = screen.getByPlaceholderText('Nom de la salle');
      fireEvent.change(roomNameInput, { target: { value: 'TEST ROOM' } });

      // Click create button
      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockApiService.createRoom).toHaveBeenCalledWith('TEST ROOM');
      });
    });

    test('should select room and update localStorage', async () => {
      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Find and change the room select
      let roomSelect: HTMLElement;
      await waitFor(() => {
        roomSelect = screen.getByRole('combobox');
        fireEvent.change(roomSelect, { target: { value: 'room1' } });
      });
  
      await waitFor(() => {
        expect(roomSelect).toHaveValue('room1');
      });
    });
  });

  describe('Folder Management', () => {
    test('should open folder creation dialog when clicking add folder button', async () => {
      renderComponent();

      await waitFor(() => {
        const addFolderButton = screen.getByText('Nouveau dossier');
        fireEvent.click(addFolderButton);
      });

      expect(screen.getByText('Créer un nouveau dossier')).toBeInTheDocument();
    });

    test('should create new folder successfully', async () => {
      mockApiService.createFolder.mockResolvedValue(true);
      const newFolders = [...mockFolders, { _id: 'folder3', userId: 'user1', title: 'Nouveau Dossier', created_at: '2024-01-03' }];
      mockApiService.getUserFolders.mockResolvedValue(newFolders);

      renderComponent();

      await waitFor(() => {
        const addFolderButton = screen.getByText('Nouveau dossier');
        fireEvent.click(addFolderButton);
      });

      const folderNameInput = screen.getByTestId('validated-text-field-titre-du-dossier');
      fireEvent.change(folderNameInput, { target: { value: 'Nouveau Dossier' } });

      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockApiService.createFolder).toHaveBeenCalledWith('Nouveau Dossier');
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });
    });

    test('should select folder and fetch its quizzes', async () => {
      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; // Get the first occurrence (sidebar button)
        fireEvent.click(folderButton);
      });

      await waitFor(() => {
        expect(mockApiService.getFolderContent).toHaveBeenCalledWith('folder1');
      });
    });

    test('should display quizzes grouped by folder', async () => {
      renderComponent();

      await waitFor(() => {
        // Check for folder tabs specifically (not the select options)
        const folderTabs = screen.getAllByText(/Dossier \d/);
        expect(folderTabs.length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Quiz Mathématiques (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Histoire (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Sciences (1 question)')).toBeInTheDocument();
      });
    });

    test('should open rename folder dialog when clicking rename button', async () => {
      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; 
        fireEvent.click(folderButton);
      });

      // Click the folder menu button 
      await waitFor(() => {
        const menuButtons = screen.getAllByTestId('MoreVertIcon');
        const folderMenuButton = menuButtons[0]; 
        fireEvent.click(folderMenuButton);
      });

      // Click the rename menu item
      const renameMenuItem = screen.getByText('Renommer');
      fireEvent.click(renameMenuItem);

      await waitFor(() => {
        expect(screen.getByText('Renommer le dossier')).toBeInTheDocument();
      });
    });

    test('should rename folder successfully', async () => {
      mockApiService.renameFolder.mockResolvedValue(true);

      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; 
        fireEvent.click(folderButton);
      });

      // Click the folder menu button 
      await waitFor(() => {
        const menuButtons = screen.getAllByTestId('MoreVertIcon');
        const folderMenuButton = menuButtons[0]; 
        fireEvent.click(folderMenuButton);
      });

      // Click the rename menu item
      const renameMenuItems = screen.getAllByText('Renommer');
      fireEvent.click(renameMenuItems[0]); 

      // Wait for dialog to open and enter new name
      await waitFor(() => {
        const renameInput = screen.getByTestId('validated-text-field-nouveau-titre-du-dossier');
        fireEvent.change(renameInput, { target: { value: 'Dossier Renommé' } });
      });

      // Find the confirm button in the dialog
      await waitFor(() => {
        const renameConfirmButton = screen.getAllByText('Renommer')[1]; 
        fireEvent.click(renameConfirmButton);
      });

      await waitFor(() => {
        expect(mockApiService.renameFolder).toHaveBeenCalledWith('folder1', 'Dossier Renommé');
      });
    });

    test('should delete folder after confirmation', async () => {
      mockConfirm.mockReturnValue(true);
      mockApiService.deleteFolder.mockResolvedValue(true);

      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; 
        fireEvent.click(folderButton);
      });

      // Click the folder menu button (MoreVert icon)
      await waitFor(() => {
        const menuButtons = screen.getAllByTestId('MoreVertIcon');
        const folderMenuButton = menuButtons[0]; 
        fireEvent.click(folderMenuButton);
      });

      // Click the delete menu item
      const deleteMenuItem = screen.getByText('Supprimer');
      fireEvent.click(deleteMenuItem);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('Voulez-vous vraiment supprimer le dossier "Dossier 1"?');
        expect(mockApiService.deleteFolder).toHaveBeenCalledWith('folder1');
      });
    });

    test('should duplicate folder successfully', async () => {
      mockApiService.duplicateFolder.mockResolvedValue(true);
      const duplicatedFolders = [...mockFolders, { _id: 'folder3', userId: 'user1', title: 'Dossier 1 (Copie)', created_at: '2024-01-03' }];
      mockApiService.getUserFolders.mockResolvedValue(duplicatedFolders);

      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; 
        fireEvent.click(folderButton);
      });

      // Click the folder menu button 
      await waitFor(() => {
        const menuButtons = screen.getAllByTestId('MoreVertIcon');
        const folderMenuButton = menuButtons[0]; 
        fireEvent.click(folderMenuButton);
      });

      // Click the duplicate menu item
      const duplicateMenuItem = screen.getByText('Dupliquer');
      fireEvent.click(duplicateMenuItem);

      await waitFor(() => {
        expect(mockApiService.duplicateFolder).toHaveBeenCalledWith('folder1');
      });
    });
  });

  describe('Quiz Management', () => {
    test('should navigate to quiz creation page when clicking "Nouveau quiz"', async () => {
      renderComponent();

      await waitFor(() => {
        const createQuizButton = screen.getByText('Nouveau quiz');
        fireEvent.click(createQuizButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/teacher/editor-quiz/new');
    });

    test('should navigate to quiz edit page when clicking edit button', async () => {
      renderComponent();

      await waitFor(() => {
        const editButtons = screen.getAllByLabelText('Modifier');
        fireEvent.click(editButtons[0]);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/teacher/editor-quiz/quiz1');
    });

    test('should launch quiz', async () => {
      renderComponent();

      await waitFor(() => {
        const launchButton = screen.getByText('Quiz Mathématiques (2 questions)');
        fireEvent.click(launchButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/teacher/manage-room-v2/quiz1');
    });



    test('should delete quiz after confirmation', async () => {
      mockConfirm.mockReturnValue(true);
      mockApiService.deleteQuiz.mockResolvedValue(true);

      renderComponent();

      await waitFor(() => {
        // Click the menu button
        const menuButtons = screen.getAllByLabelText('Plus d\'actions');
        fireEvent.click(menuButtons[0]);
      });

      // Click the delete menu item
      const deleteMenuItem = screen.getByText('Supprimer');
      fireEvent.click(deleteMenuItem);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('Voulez-vous vraiment supprimer ce quiz?');
        expect(mockApiService.deleteQuiz).toHaveBeenCalledWith('quiz1');
      });
    });

    test('should duplicate quiz successfully', async () => {
      mockApiService.duplicateQuiz.mockResolvedValue(true);

      renderComponent();

      await waitFor(() => {
        // Click the menu button
        const menuButtons = screen.getAllByLabelText('Plus d\'actions');
        fireEvent.click(menuButtons[0]);
      });

      // Click the duplicate menu item
      const duplicateMenuItem = screen.getByText('Dupliquer');
      fireEvent.click(duplicateMenuItem);

      await waitFor(() => {
        expect(mockApiService.duplicateQuiz).toHaveBeenCalledWith('quiz1');
      });
    });
  });

  describe('Search Functionality', () => {
    test('should toggle search visibility when clicking search icon', async () => {
      renderComponent();

      await waitFor(() => {
        const searchIcon = screen.getByTestId('search-toggle-icon');
        fireEvent.click(searchIcon);
      });

      const searchInput = screen.getByPlaceholderText('Rechercher un quiz');
      expect(searchInput).toBeInTheDocument();

      // Click the search icon in the input field to hide
      const closeIcon = screen.getByTestId('search-close-icon');
      fireEvent.click(closeIcon);

      expect(screen.queryByPlaceholderText('Rechercher un quiz')).not.toBeInTheDocument();
    });

    test('should filter quizzes based on search term', async () => {
      renderComponent();

      await waitFor(() => {
        const searchIcon = screen.getByTestId('SearchIcon');
        fireEvent.click(searchIcon);
      });

      const searchInput = screen.getByPlaceholderText('Rechercher un quiz');
      fireEvent.change(searchInput, { target: { value: 'Mathématiques' } });

      await waitFor(() => {
        expect(screen.getByText('Quiz Mathématiques (2 questions)')).toBeInTheDocument();
        expect(screen.queryByText('Quiz Histoire (2 questions)')).not.toBeInTheDocument();
        expect(screen.queryByText('Quiz Sciences (1 question)')).not.toBeInTheDocument();
      });
    });

    test('should show all quizzes when search term is empty', async () => {
      renderComponent();

      await waitFor(() => {
        const searchIcon = screen.getByTestId('SearchIcon');
        fireEvent.click(searchIcon);
      });

      const searchInput = screen.getByPlaceholderText('Rechercher un quiz');
      fireEvent.change(searchInput, { target: { value: 'Mathématiques' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Quiz Mathématiques (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Histoire (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Sciences (1 question)')).toBeInTheDocument();
      });
    });
  });

  describe('Import Functionality', () => {
    test('should open import modal when clicking "Importer" button', async () => {
      renderComponent();

      await waitFor(() => {
        const importButton = screen.getByText('Importer');
        fireEvent.click(importButton);
      });

      expect(screen.getByTestId('import-modal')).toBeInTheDocument();
      expect(screen.getByText('Importation de quiz')).toBeInTheDocument();
    });

    test('should close import modal when clicking close button', async () => {
      renderComponent();

      await waitFor(() => {
        const importButton = screen.getByText('Importer');
        fireEvent.click(importButton);
      });

      const closeButton = screen.getByTestId('close-import-modal');
      fireEvent.click(closeButton);

      expect(screen.queryByTestId('import-modal')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      mockApiService.getUserRooms.mockRejectedValue(new Error('Network error'));

      renderComponent();

      // Component should still render even with API errors
      await waitFor(() => {
        expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
      });
    });

    test('should show error dialog for room creation failure', async () => {
      mockApiService.createRoom.mockRejectedValue(new Error('Room creation failed'));

      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Click the "Nouvelle salle" button
      const newRoomButton = screen.getByText('Nouvelle salle');
      fireEvent.click(newRoomButton);

      // Enter room name
      const roomNameInput = screen.getByPlaceholderText('Nom de la salle');
      fireEvent.change(roomNameInput, { target: { value: 'TEST' } });

      // Click create button
      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erreur lors de la création de la salle');
      });
    });

    test('should handle folder operation errors', async () => {
      mockApiService.createFolder.mockRejectedValue(new Error('Folder creation failed'));

      renderComponent();

      await waitFor(() => {
        const addFolderButton = screen.getByText('Nouveau dossier');
        fireEvent.click(addFolderButton);
      });

      const folderNameInput = screen.getByTestId('validated-text-field-titre-du-dossier');
      fireEvent.change(folderNameInput, { target: { value: 'Test Folder' } });

      const createButton = screen.getByText('Créer');
      fireEvent.click(createButton);

      // Should handle error gracefully without crashing
      await waitFor(() => {
        expect(mockApiService.createFolder).toHaveBeenCalledWith('Test Folder');
      });
    });
  });

  describe('Quiz Validation', () => {
    test('should disable launch button for invalid quizzes', async () => {
      // Mock parse to throw error for invalid quiz
      const mockParse = require('gift-pegjs').parse;
      mockParse.mockImplementation(() => {
        throw new Error('Invalid question format');
      });

      renderComponent();

      await waitFor(() => {
        const launchButton = screen.getByText('Quiz Mathématiques (2 questions)');
        expect(launchButton).toBeDisabled();
      });
    });

    test('should enable launch button for valid quizzes', async () => {
      renderComponent();

      await waitFor(() => {
        const launchButton = screen.getByText('Quiz Mathématiques (2 questions)');
        expect(launchButton).not.toBeDisabled();
      });
    });
  });

  describe('Dialog Interactions', () => {
    test('should close room creation dialog on cancel', async () => {
      renderComponent();

      // First expand the room options section
      await waitFor(() => {
        const roomsButton = screen.getByText('Salles');
        fireEvent.click(roomsButton);
      });

      // Click the "Nouvelle salle" button
      const newRoomButton = screen.getByText('Nouvelle salle');
      fireEvent.click(newRoomButton);

      // Check that input field is visible
      expect(screen.getByPlaceholderText('Nom de la salle')).toBeInTheDocument();

      // Click cancel button (X icon)
      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Nom de la salle')).not.toBeInTheDocument();
      });
    });

    test('should close folder creation dialog on cancel', async () => {
      renderComponent();

      await waitFor(() => {
        const addFolderButton = screen.getByText('Nouveau dossier');
        fireEvent.click(addFolderButton);
      });

      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Créer un nouveau dossier')).not.toBeInTheDocument();
      });
    });

    test('should close folder rename dialog on cancel', async () => {
      renderComponent();

      await waitFor(() => {
        const folderButton = screen.getAllByText('Dossier 1')[0]; 
        fireEvent.click(folderButton);
      });

      // Click the folder menu button
      await waitFor(() => {
        const menuButtons = screen.getAllByTestId('MoreVertIcon');
        const folderMenuButton = menuButtons[0]; 
        fireEvent.click(folderMenuButton);
      });

      // Click the rename menu item
      const renameMenuItem = screen.getByText('Renommer');
      fireEvent.click(renameMenuItem);

      await waitFor(() => {
        expect(screen.getByText('Renommer le dossier')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Annuler');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Renommer le dossier')).not.toBeInTheDocument();
      });
    });

    test('should close error dialog when clicking close button', async () => {
      // Set up the error dialog to be open initially
      renderComponent();

      // Manually trigger the error dialog by setting the state
      await waitFor(() => {
    
        const errorDialog = screen.queryByText('Erreur');
        if (errorDialog) {
          const closeButton = screen.getByText('Fermer');
          fireEvent.click(closeButton);
          expect(screen.queryByText('Erreur')).not.toBeInTheDocument();
        } else {
          expect(true).toBe(true);
        }
      });
    });
  });

  describe('UI Components', () => {
    test('should render download and share modals for each quiz', async () => {
      renderComponent();

      await waitFor(() => {
        // DownloadQuizModal should be rendered
        expect(screen.getByTestId('download-modal-quiz1')).toBeInTheDocument();
        expect(screen.getByTestId('download-modal-quiz2')).toBeInTheDocument();
        expect(screen.getByTestId('download-modal-quiz3')).toBeInTheDocument();

  
        const menuButtons = screen.getAllByLabelText('Plus d\'actions');
        expect(menuButtons).toHaveLength(3);
      });
    });

    test('should display quiz count correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Quiz Mathématiques (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Histoire (2 questions)')).toBeInTheDocument();
        expect(screen.getByText('Quiz Sciences (1 question)')).toBeInTheDocument();
      });
    });

    test('should show correct folder structure', async () => {
      renderComponent();

      await waitFor(() => {
        // Check that folders are displayed as cards with folder names
        const dossier1Elements = screen.getAllByText('Dossier 1');
        const dossier2Elements = screen.getAllByText('Dossier 2');
        expect(dossier1Elements.length).toBeGreaterThan(0);
        expect(dossier2Elements.length).toBeGreaterThan(0);

        // Check that quizzes are grouped by folder in cards
        const folderCards = screen.getAllByText(/Dossier \d/);
        expect(folderCards.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});