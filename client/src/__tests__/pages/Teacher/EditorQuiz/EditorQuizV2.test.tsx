import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EditorQuizV2 from '../../../../pages/Teacher/EditorQuiz/EditorQuizV2';
import ApiService from '../../../../services/ApiService';
import { QuizType } from '../../../../Types/QuizType';
import { FolderType } from '../../../../Types/FolderType';

// Mock dependencies
jest.mock('../../../../services/ApiService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

// Mock child components
jest.mock('../../../../components/Editor/EditorV2', () => ({
  __esModule: true,
  default: ({ label, initialValue, onEditorChange }: any) => (
    <div data-testid="editor-v2">
      <label>{label}</label>
      <textarea
        data-testid="editor-textarea"
        value={initialValue}
        onChange={(e) => onEditorChange(e.target.value)}
      />
    </div>
  ),
}));

jest.mock('../../../../components/GIFTCheatSheet/GiftCheatSheetV2', () => ({
  __esModule: true,
  default: () => <div data-testid="gift-cheat-sheet">GIFT Cheat Sheet</div>,
}));

jest.mock('../../../../components/GiftTemplate/GIFTTemplatePreviewV2', () => ({
  __esModule: true,
  default: ({ questions }: any) => (
    <div data-testid="gift-preview">
      {questions.map((q: string, i: number) => (
        <div key={`question-${q}-${i}`} data-testid={`question-${i}`}>{q}</div>
      ))}
    </div>
  ),
}));

jest.mock('../../../../components/ReturnButton/ReturnButtonV2', () => ({
  __esModule: true,
  default: ({ askConfirm, message }: any) => (
    <button data-testid="return-button" data-ask-confirm={askConfirm} data-message={message}>
      Return
    </button>
  ),
}));

jest.mock('../../../../components/ImageGallery/ImageGalleryModal/ImageGalleryModalV2', () => ({
  __esModule: true,
  default: ({ handleCopy }: any) => (
    <button data-testid="image-gallery-modal" onClick={() => handleCopy('test-image-id')}>
      Open Gallery
    </button>
  ),
}));

jest.mock('../../../../components/ValidatedTextField/ValidatedTextField', () => ({
  __esModule: true,
  default: ({ fieldPath, initialValue, onValueChange, label, placeholder }: any) => {
    const id = `validated-text-field-${fieldPath}`;
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          data-testid={`validated-text-field-${fieldPath}`}
          value={initialValue}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    );
  },
}));

// Mock window methods
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(window, 'scrollY', {
  writable: true,
  value: 0,
});

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

  // Mock data for sorting tests
  const mockFoldersForSorting: FolderType[] = [
    { _id: 'folder3', userId: 'user1', title: 'Zebra Folder', created_at: '2023-01-03' },
    { _id: 'folder1', userId: 'user1', title: 'Alpha Folder', created_at: '2023-01-01' },
    { _id: 'folder2', userId: 'user1', title: 'Beta Folder', created_at: '2023-01-02' },
    { _id: 'folder4', userId: 'user1', title: 'Gamma Folder', created_at: '2023-01-04' },
  ];
beforeEach(() => {
  jest.clearAllMocks();
  mockNavigate.mockClear();
  mockUseParams.mockClear();

  // Setup default mocks
  mockApiService.getUserFolders.mockResolvedValue([]);
  mockApiService.createQuiz.mockResolvedValue(true);
  mockApiService.updateQuiz.mockResolvedValue(true);

  // Mock react-router hooks
  (require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    },
    writable: true,
  });

  // Mock clipboard
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
    writable: true,
  });
});

const renderComponent = (initialEntries = ['/teacher/editor-quiz/new']) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <EditorQuizV2 />
    </MemoryRouter>
  );
};

describe('EditorQuizV2 Component', () => {
  describe('Rendering', () => {
    test('renders component for new quiz', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      expect(screen.getByText('Éditeur de quiz')).toBeInTheDocument();
      expect(screen.getByText('Prévisualisation')).toBeInTheDocument();
      expect(screen.getByTestId('editor-v2')).toBeInTheDocument();
      expect(screen.getByTestId('gift-cheat-sheet')).toBeInTheDocument();
      expect(screen.getByTestId('gift-preview')).toBeInTheDocument();
    });

    test('shows loading state for existing quiz', () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'existing-quiz-id' });
      // Mock getQuiz to return a promise that never resolves to simulate loading
      mockApiService.getQuiz.mockReturnValue(new Promise(() => {}));

      renderComponent(['/teacher/editor-quiz/existing-quiz-id']);

      expect(screen.getByText('Chargement du quiz...')).toBeInTheDocument();
    });

    test('renders quiz configuration form', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Wait for the component to render and folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Check the basic components are there
      expect(screen.getByText('Éditeur de quiz')).toBeInTheDocument();
      
      // Check for the form elements with more specific queries
      const titleLabel = screen.getByLabelText('Titre du quiz');
      expect(titleLabel).toBeInTheDocument();
      
      const folderLabel = screen.getByLabelText('Dossier');
      expect(folderLabel).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('updates quiz title when input changes', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'New Quiz Title' } });

      expect(titleInput).toHaveValue('New Quiz Title');
    });

    test('updates selected folder when changed', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Folder 1', created_at: '2023-01-01' },
        { _id: 'folder2', userId: 'user1', title: 'Folder 2', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Wait for the folders to load by waiting for the API call to complete
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Find the MUI Select's native input by class
      const selectInput = document.querySelector('.MuiSelect-nativeInput') as HTMLInputElement;
      expect(selectInput).toBeTruthy();
      
      fireEvent.change(selectInput, { target: { value: 'folder1' } });

      expect(selectInput).toHaveValue('folder1');
    });

    test('updates editor content and filtered value', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      const editorTextarea = screen.getByTestId('editor-textarea');
      fireEvent.change(editorTextarea, { target: { value: 'Question 1?\n\nQuestion 2?' } });

      await waitFor(() => {
        expect(screen.getByTestId('question-0')).toHaveTextContent('Question 1?');
        expect(screen.getByTestId('question-1')).toHaveTextContent('Question 2?');
      });
    });
  });

  describe('API Integration', () => {
    test('fetches user folders on mount', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalledTimes(1);
      });
    });

    test('fetches quiz data for existing quiz', async () => {
      const mockQuiz: QuizType = {
        _id: 'quiz1',
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Question 1?', 'Question 2?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mocks BEFORE rendering
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'quiz1' });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);

      renderComponent(['/teacher/editor-quiz/quiz1']);

      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith('quiz1');
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });
    });

    test('handles quiz not found error', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Set up mocks BEFORE rendering
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'nonexistent' });
      mockApiService.getQuiz.mockResolvedValue('Quiz not found');

      renderComponent(['/teacher/editor-quiz/nonexistent']);

      // wait for the API call to be made
      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith('nonexistent');
      }, { timeout: 3000 });

      // check for the alert and navigation
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Une erreur est survenue')
        );
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
      }, { timeout: 3000 });

      alertMock.mockRestore();
    });

    test('creates new quiz successfully', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Fill form
      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'New Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText('Dossier');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Dossier');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      
      const saveButton = screen.getByRole('button', { name: /enregistrer$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.createQuiz).toHaveBeenCalledWith(
          'New Quiz',
          [],
          'folder1'
        );
      });
    });

    test('updates existing quiz successfully', async () => {
      const mockQuiz: QuizType = {
        _id: 'quiz1',
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Old Question?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'quiz1' });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);

      renderComponent(['/teacher/editor-quiz/quiz1']);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz' } });

      
      const saveButton = screen.getByRole('button', { name: /enregistrer$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.updateQuiz).toHaveBeenCalledWith(
          'quiz1',
          'Updated Quiz',
          ['Old Question?']
        );
      });
    });
  });

  describe('Validation', () => {
    test('shows error when saving without title', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Select folder but leave title empty
      await waitFor(() => {
        const select = screen.getByLabelText('Dossier');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Dossier');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      const saveButton = screen.getByRole('button', { name: /enregistrer$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Veuillez saisir un titre pour le quiz')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows error when saving without folder', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      // Fill title but leave folder empty
      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const saveButton = screen.getByRole('button', { name: /enregistrer$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Veuillez choisir un dossier')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('User Interactions', () => {
    test('scrolls to top when button is clicked', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      // Simulate scroll by setting scrollY and triggering scroll event
      Object.defineProperty(window, 'scrollY', { value: 400 });
      window.dispatchEvent(new Event('scroll'));

      // Wait for the button to appear
      const scrollButton = await screen.findByTitle('Scroll to top');
      fireEvent.click(scrollButton);

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('copies image link to clipboard', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      const galleryButton = screen.getByTestId('image-gallery-modal');
      fireEvent.click(galleryButton);

      // Click on the generated image link
      const imageLinkButton = await screen.findByText(/\[markdown\]/);
      fireEvent.click(imageLinkButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    test('handles save and exit navigation', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Fill form
      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText('Dossier');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Dossier');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      // Click save and exit
      const saveExitButton = screen.getByRole('button', { name: /enregistrer et quitter/i });
      fireEvent.click(saveExitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
      });
    });
  });

  describe('Error Handling', () => {
    test('handles save error gracefully', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.createQuiz.mockRejectedValue(new Error('Save failed'));

      renderComponent();

      // Wait for folders to be loaded
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill form
      const titleInput = screen.getByTestId('validated-text-field-quiz.title');
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const select = screen.getByRole('combobox', { name: 'Dossier' });
      fireEvent.mouseDown(select);
      
      // Wait for the option to be available
      await waitFor(() => {
        const option = screen.getByText('Test Folder');
        fireEvent.click(option);
      });

      const saveButton = screen.getByRole('button', { name: /enregistrer$/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.')).toBeInTheDocument();
      });
    });
  });

  describe('Folder Dropdown Sorting', () => {
    test('should display folders in alphabetical order in the folder dropdown', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      // Setup mocks with unsorted folders
      mockApiService.getUserFolders.mockResolvedValue(mockFoldersForSorting);

      renderComponent();

      // Wait for folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Click the folder dropdown to open it
      const folderSelect = screen.getByRole('combobox', { name: 'Dossier' });
      fireEvent.mouseDown(folderSelect);

      // Wait for dropdown to open and check folder order
      await waitFor(() => {
        // Get all folder menu items (excluding the placeholder option)
        const folderMenuItems = screen.getAllByRole('option').filter(option => 
          !option.textContent?.includes('Choisir un dossier')
        );
        
        const displayedFolderNames = folderMenuItems.map(item => item.textContent?.trim()).filter(Boolean);
        const expectedOrder = ['Alpha Folder', 'Beta Folder', 'Gamma Folder', 'Zebra Folder'];
        
        expect(displayedFolderNames).toEqual(expectedOrder);
      });
    });

    test('should maintain alphabetical sorting when selecting folders', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      mockApiService.getUserFolders.mockResolvedValue(mockFoldersForSorting);

      renderComponent();

      // Wait for folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Open dropdown and verify we can select a folder that should be in the middle alphabetically
      const folderSelect = screen.getByRole('combobox', { name: 'Dossier' });
      fireEvent.mouseDown(folderSelect);

      // Wait for options to be available
      await waitFor(() => {
        const gammaOption = screen.getByText('Gamma Folder');
        expect(gammaOption).toBeInTheDocument();
      });

      // Click on "Gamma Folder" which should be in the middle of the sorted list
      const gammaOption = screen.getByText('Gamma Folder');
      fireEvent.click(gammaOption);

      // Verify the selection worked
      expect(folderSelect).toHaveTextContent('Gamma Folder');

      // Open dropdown again to verify order is still correct
      fireEvent.mouseDown(folderSelect);

      await waitFor(() => {
        const folderMenuItems = screen.getAllByRole('option').filter(option => 
          !option.textContent?.includes('Choisir un dossier')
        );
        
        const displayedFolderNames = folderMenuItems.map(item => item.textContent?.trim()).filter(Boolean);
        const expectedOrder = ['Alpha Folder', 'Beta Folder', 'Gamma Folder', 'Zebra Folder'];
        
        expect(displayedFolderNames).toEqual(expectedOrder);
      });
    });
  });
});
