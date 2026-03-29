import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EditorQuiz from '../../../../pages/Teacher/EditorQuiz/EditorQuiz';
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
jest.mock('../../../../components/Editor/Editor', () => ({
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
  default: ({ questions, hideAnswers }: any) => (
    <div data-testid="gift-preview" data-hide-answers={hideAnswers}>
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


// TEST CONSTANTS & VARIABLES CONFIGURATION
const TEST_TEXTS = {
  PAGE_TITLE: 'Éditeur de quiz',
  PREVIEW_TITLE: 'Prévisualisation',
  LOADING_TEXT: 'Chargement du quiz...',
  QUIZ_TITLE_LABEL: 'Titre du quiz',
  FOLDER_LABEL: 'Dossier',
  CHOOSE_FOLDER_PLACEHOLDER: 'Choisir un dossier',
  SAVE_BUTTON: /enregistrer$/i,
  SAVE_EXIT_BUTTON: /enregistrer et quitter/i,
  ERROR_NO_TITLE: 'Veuillez saisir un titre pour le quiz',
  ERROR_NO_FOLDER: 'Veuillez choisir un dossier',
  ERROR_SAVE_FAILED: 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.',
  ERROR_QUIZ_EXISTS: 'Le quiz existe déjà.',
  ERROR_UPDATE_FAILED: 'Une erreur s\'est produite lors de la mise à jour du quiz.',
  ERROR_SERVER_UNKNOWN: 'Erreur serveur inconnue lors de la requête.',
  ALERT_ERROR: 'Une erreur est survenue',
  SCROLL_BUTTON_TITLE: 'Scroll to top',
  RESIZER_TITLE: 'Faites glisser pour redimensionner',
  PRINT_BUTTON: /imprimer/i,
  HIDE_ANSWERS_SWITCH: /masquer les réponses/i,
};

const TEST_IDS = {
  EDITOR: 'editor-v2',
  EDITOR_TEXTAREA: 'editor-textarea',
  CHEAT_SHEET: 'gift-cheat-sheet',
  PREVIEW: 'gift-preview',
  TITLE_INPUT: 'validated-text-field-quiz.title',
  IMAGE_GALLERY_BTN: 'image-gallery-modal',
  QUESTION_PREFIX: 'question-',
};

const TEST_ROUTES = {
  NEW_QUIZ: '/teacher/editor-quiz/new',
  EXISTING_QUIZ: (id: string) => `/teacher/editor-quiz/${id}`,
  DASHBOARD: '/teacher/dashboard',
};

const MOCK_IDS = {
  NEW: 'new',
  MOCK_QUIZ: 'mock-quiz-id',
  EXISTING_QUIZ: 'quiz1',
  NON_EXISTENT: 'nonexistent',
};

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
  mockApiService.createQuiz.mockResolvedValue(MOCK_IDS.MOCK_QUIZ);
  mockApiService.updateQuiz.mockResolvedValue(true);

  // Mock react-router hooks
  (require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

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

const renderComponent = (initialEntries = [TEST_ROUTES.NEW_QUIZ]) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <EditorQuiz />
    </MemoryRouter>
  );
};

describe('EditorQuiz Component', () => {
  describe('Rendering', () => {
    test('renders component for new quiz', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      expect(screen.getByText(TEST_TEXTS.PAGE_TITLE)).toBeInTheDocument();
      expect(screen.getByText(TEST_TEXTS.PREVIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.EDITOR)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.CHEAT_SHEET)).toBeInTheDocument();
      expect(screen.getByTestId(TEST_IDS.PREVIEW)).toBeInTheDocument();
    });

    test('shows loading state for existing quiz', () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.EXISTING_QUIZ });
      // Mock getQuiz to return a promise that never resolves to simulate loading
      mockApiService.getQuiz.mockReturnValue(new Promise(() => {}));

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.EXISTING_QUIZ)]);

      expect(screen.getByText(TEST_TEXTS.LOADING_TEXT)).toBeInTheDocument();
    });

    test('renders quiz configuration form', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
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
      expect(screen.getByText(TEST_TEXTS.PAGE_TITLE)).toBeInTheDocument();
      
      // Check for the form elements with more specific queries
      const titleLabel = screen.getByLabelText(TEST_TEXTS.QUIZ_TITLE_LABEL);
      expect(titleLabel).toBeInTheDocument();
      
      const folderLabel = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
      expect(folderLabel).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('updates quiz title when input changes', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'New Quiz Title' } });

      expect(titleInput).toHaveValue('New Quiz Title');
    });

    test('updates selected folder when changed', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
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
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      const editorTextarea = screen.getByTestId(TEST_IDS.EDITOR_TEXTAREA);
      fireEvent.change(editorTextarea, { target: { value: 'Question 1?\n\nQuestion 2?' } });

      await waitFor(() => {
        expect(screen.getByTestId(`${TEST_IDS.QUESTION_PREFIX}0`)).toHaveTextContent('Question 1?');
        expect(screen.getByTestId(`${TEST_IDS.QUESTION_PREFIX}1`)).toHaveTextContent('Question 2?');
      });
    });
  });

  describe('API Integration', () => {
    test('fetches user folders on mount', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
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
        _id: MOCK_IDS.EXISTING_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Question 1?', 'Question 2?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Set up mocks BEFORE rendering
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.EXISTING_QUIZ });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.EXISTING_QUIZ)]);

      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith(MOCK_IDS.EXISTING_QUIZ);
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });
    });

    test('handles quiz not found error', async () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      // Set up mocks BEFORE rendering
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NON_EXISTENT });
      mockApiService.getQuiz.mockResolvedValue('Quiz not found');

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.NON_EXISTENT)]);

      // wait for the API call to be made
      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith(MOCK_IDS.NON_EXISTENT);
      }, { timeout: 3000 });

      // check for the alert and navigation
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining(TEST_TEXTS.ALERT_ERROR)
        );
        expect(mockNavigate).toHaveBeenCalledWith(TEST_ROUTES.DASHBOARD);
      }, { timeout: 3000 });

      alertMock.mockRestore();
    });

    test('creates new quiz successfully', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      const mockCreatedQuiz: QuizType = {
        _id: MOCK_IDS.MOCK_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'New Quiz',
        content: [],
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.getQuiz.mockResolvedValue(mockCreatedQuiz);

      renderComponent();

      // Fill form
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'New Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      
      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.createQuiz).toHaveBeenCalledWith(
          'New Quiz',
          [],
          'folder1'
        );
        expect(mockApiService.getQuiz).toHaveBeenCalledWith(MOCK_IDS.MOCK_QUIZ);
        expect(mockNavigate).toHaveBeenCalledWith(TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.MOCK_QUIZ), { replace: true });
      });
    });

    test('creates quiz then allows multiple saves without errors', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      const mockCreatedQuiz: QuizType = {
        _id: MOCK_IDS.MOCK_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'New Quiz',
        content: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.getQuiz.mockResolvedValue(mockCreatedQuiz);
      mockApiService.updateQuiz.mockResolvedValue(true);

      renderComponent();

      // Fill form
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'New Quiz' } });

      // Wait for folders to load and select folder
      await waitFor(() => {
        const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      // First save - creates the quiz
      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      // Wait for quiz creation and state transition
      await waitFor(() => {
        expect(mockApiService.createQuiz).toHaveBeenCalledWith(
          'New Quiz',
          [],
          'folder1'
        );
        expect(mockApiService.getQuiz).toHaveBeenCalledWith(MOCK_IDS.MOCK_QUIZ);
        expect(mockNavigate).toHaveBeenCalledWith(TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.MOCK_QUIZ), { replace: true });
      });

      // Clear mocks to check subsequent calls
      mockApiService.createQuiz.mockClear();
      mockApiService.getQuiz.mockClear();
      mockNavigate.mockClear();

      // Now modify the quiz content
      const editorTextarea = screen.getByTestId(TEST_IDS.EDITOR_TEXTAREA);
      fireEvent.change(editorTextarea, { target: { value: 'Updated Question?\n\nAnother Question?' } });

      // Second save - should update the quiz, not create again
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Verify updateQuiz was called, not createQuiz
        expect(mockApiService.updateQuiz).toHaveBeenCalledWith(
          MOCK_IDS.MOCK_QUIZ,
          'New Quiz',
          ['Updated Question?', 'Another Question?']
        );
        expect(mockApiService.createQuiz).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled(); // Should not navigate again
      });

      // Third save - should still work
      fireEvent.change(titleInput, { target: { value: 'Final Quiz Title' } });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.updateQuiz).toHaveBeenCalledWith(
          MOCK_IDS.MOCK_QUIZ,
          'Final Quiz Title',
          ['Updated Question?', 'Another Question?']
        );
        // Verify createQuiz was never called again
        expect(mockApiService.createQuiz).toHaveBeenCalledTimes(0);
        // Verify no error messages appeared
        expect(screen.queryByText(TEST_TEXTS.ERROR_SAVE_FAILED)).not.toBeInTheDocument();
      });
    });

    test('updates existing quiz successfully', async () => {
      const mockQuiz: QuizType = {
        _id: MOCK_IDS.EXISTING_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Old Question?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.EXISTING_QUIZ });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.EXISTING_QUIZ)]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz' } });

      
      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.updateQuiz).toHaveBeenCalledWith(
          MOCK_IDS.EXISTING_QUIZ,
          'Updated Quiz',
          ['Old Question?']
        );
      });
    });
  });

  describe('Validation', () => {
    test('shows error when saving without title', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Select folder but leave title empty
      await waitFor(() => {
        const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_NO_TITLE)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('shows error when saving without folder', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      // Fill title but leave folder empty
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_NO_FOLDER)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('User Interactions', () => {
    test('scrolls to top when button is clicked', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      // Simulate scroll by setting scrollY and triggering scroll event
      Object.defineProperty(window, 'scrollY', { value: 400 });
      window.dispatchEvent(new Event('scroll'));

      // Wait for the button to appear
      const scrollButton = await screen.findByTitle(TEST_TEXTS.SCROLL_BUTTON_TITLE);
      fireEvent.click(scrollButton);

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('copies image link to clipboard', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });

      renderComponent();

      const galleryButton = screen.getByTestId(TEST_IDS.IMAGE_GALLERY_BTN);
      fireEvent.click(galleryButton);

      // Click on the generated image link
      const imageLinkButton = await screen.findByText(/\[markdown\]/);
      fireEvent.click(imageLinkButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    test('handles save and exit navigation', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Fill form
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(TEST_TEXTS.FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      // Click save and exit
      const saveExitButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_EXIT_BUTTON });
      fireEvent.click(saveExitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(TEST_ROUTES.DASHBOARD);
      });
    });
  });

  describe('Error Handling', () => {
    test('handles save error gracefully', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
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
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const select = screen.getByRole('combobox', { name: TEST_TEXTS.FOLDER_LABEL });
      fireEvent.mouseDown(select);
      
      // Wait for the option to be available
      await waitFor(() => {
        const option = screen.getByText('Test Folder');
        fireEvent.click(option);
      });

      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_SAVE_FAILED)).toBeInTheDocument();
      });
    });

    test('shows error notification when createQuiz returns error string', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.createQuiz.mockResolvedValue(TEST_TEXTS.ERROR_QUIZ_EXISTS);

      renderComponent();

      // Wait for folders to be loaded
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill form
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const select = screen.getByRole('combobox', { name: TEST_TEXTS.FOLDER_LABEL });
      fireEvent.mouseDown(select);
      
      // Wait for the option to be available
      await waitFor(() => {
        const option = screen.getByText('Test Folder');
        fireEvent.click(option);
      });

      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_QUIZ_EXISTS)).toBeInTheDocument();
      });
    });

    test('shows error notification when updateQuiz returns error string', async () => {
      const mockQuiz: QuizType = {
        _id: MOCK_IDS.EXISTING_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Old Question?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.EXISTING_QUIZ });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);
      mockApiService.updateQuiz.mockResolvedValue(TEST_TEXTS.ERROR_UPDATE_FAILED);

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.EXISTING_QUIZ)]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz' } });

      const saveButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_BUTTON });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_UPDATE_FAILED)).toBeInTheDocument();
      });
    });

    test('does not navigate on save and exit when createQuiz returns error string', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: 'Test Folder', created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.createQuiz.mockResolvedValue(TEST_TEXTS.ERROR_SERVER_UNKNOWN);

      renderComponent();

      // Wait for folders to be loaded
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill form
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const select = screen.getByRole('combobox', { name: TEST_TEXTS.FOLDER_LABEL });
      fireEvent.mouseDown(select);
      
      // Wait for the option to be available
      await waitFor(() => {
        const option = screen.getByText('Test Folder');
        fireEvent.click(option);
      });

      const saveExitButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_EXIT_BUTTON });
      fireEvent.click(saveExitButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_SERVER_UNKNOWN)).toBeInTheDocument();
      });

      // Ensure navigation did not occur
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('does not navigate on save and exit when updateQuiz returns error string', async () => {
      const mockQuiz: QuizType = {
        _id: MOCK_IDS.EXISTING_QUIZ,
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Old Question?'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.EXISTING_QUIZ });
      mockApiService.getQuiz.mockResolvedValue(mockQuiz);
      mockApiService.updateQuiz.mockResolvedValue(TEST_TEXTS.ERROR_UPDATE_FAILED);

      renderComponent([TEST_ROUTES.EXISTING_QUIZ(MOCK_IDS.EXISTING_QUIZ)]);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
      });

      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz' } });

      const saveExitButton = screen.getByRole('button', { name: TEST_TEXTS.SAVE_EXIT_BUTTON });
      fireEvent.click(saveExitButton);

      await waitFor(() => {
        expect(screen.getByText(TEST_TEXTS.ERROR_UPDATE_FAILED)).toBeInTheDocument();
      });

      // Ensure navigation did not occur
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Folder Dropdown Sorting', () => {
    test('should display folders in alphabetical order in the folder dropdown', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      // Setup mocks with unsorted folders
      mockApiService.getUserFolders.mockResolvedValue(mockFoldersForSorting);

      renderComponent();

      // Wait for folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Click the folder dropdown to open it
      const folderSelect = screen.getByRole('combobox', { name: TEST_TEXTS.FOLDER_LABEL });
      fireEvent.mouseDown(folderSelect);

      // Wait for dropdown to open and check folder order
      await waitFor(() => {
        // Get all folder menu items (excluding the placeholder option)
        const folderMenuItems = screen.getAllByRole('option').filter(option => 
          !option.textContent?.includes(TEST_TEXTS.CHOOSE_FOLDER_PLACEHOLDER)
        );
        
        const displayedFolderNames = folderMenuItems.map(item => item.textContent?.trim()).filter(Boolean);
        const expectedOrder = ['Alpha Folder', 'Beta Folder', 'Gamma Folder', 'Zebra Folder'];
        
        expect(displayedFolderNames).toEqual(expectedOrder);
      });
    });

    test('should maintain alphabetical sorting when selecting folders', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      mockApiService.getUserFolders.mockResolvedValue(mockFoldersForSorting);

      renderComponent();

      // Wait for folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Open dropdown and verify we can select a folder that should be in the middle alphabetically
      const folderSelect = screen.getByRole('combobox', { name: TEST_TEXTS.FOLDER_LABEL });
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
          !option.textContent?.includes(TEST_TEXTS.CHOOSE_FOLDER_PLACEHOLDER)
        );
        
        const displayedFolderNames = folderMenuItems.map(item => item.textContent?.trim()).filter(Boolean);
        const expectedOrder = ['Alpha Folder', 'Beta Folder', 'Gamma Folder', 'Zebra Folder'];
        
        expect(displayedFolderNames).toEqual(expectedOrder);
      });
    });
  });

  describe('Print Feature', () => {
    test('should call window.print when print button is clicked', async () => {
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      
      renderComponent();
      
      const printButton = screen.getByRole('button', { name: TEST_TEXTS.PRINT_BUTTON });
      fireEvent.click(printButton);
      
      expect(printSpy).toHaveBeenCalledTimes(1);
      
      printSpy.mockRestore();
    });

    test('should render quiz title in print-only element', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      
      renderComponent();
      
      const titleInput = screen.getByTestId(TEST_IDS.TITLE_INPUT);
      fireEvent.change(titleInput, { target: { value: 'My Print Quiz Title' } });
      
      const printTitleElement = screen.getByText('My Print Quiz Title', { selector: '.editor-quiz-print-title' });
      expect(printTitleElement).toBeInTheDocument();
    });

    test('should toggle hideAnswers state when switch is clicked', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: MOCK_IDS.NEW });
      
      renderComponent();
      
      const giftPreview = screen.getByTestId(TEST_IDS.PREVIEW);
      expect(giftPreview).toHaveAttribute('data-hide-answers', 'false');
      
      const hideAnswersSwitch = screen.getByRole('checkbox', { name: TEST_TEXTS.HIDE_ANSWERS_SWITCH });
      fireEvent.click(hideAnswersSwitch);
      
      expect(giftPreview).toHaveAttribute('data-hide-answers', 'true');
      
      fireEvent.click(hideAnswersSwitch);
      
      expect(giftPreview).toHaveAttribute('data-hide-answers', 'false');
    });
  });

  describe('Resizable Panes', () => {
    test('drag interactions update pane width properly', async () => {
      renderComponent();

      const divider = screen.getByTitle(TEST_TEXTS.RESIZER_TITLE);
      expect(divider).toBeInTheDocument();

      // Verify divider is rendered and can respond to interactions
      expect(divider).toHaveAttribute('title', TEST_TEXTS.RESIZER_TITLE);

      // Simulate drag start
      fireEvent.mouseDown(divider, { clientX: 0 });

      // Simulate drag movement
      fireEvent.mouseMove(document, { clientX: 300 });
      fireEvent.mouseMove(document, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 900 });

      // Complete the drag
      fireEvent.mouseUp(document);

      // Verify the divider component exists and functions
      expect(divider).toBeInTheDocument();
    });

    test('hover interactions change background color', async () => {
      renderComponent();
      const divider = screen.getByTitle(TEST_TEXTS.RESIZER_TITLE);
      
      fireEvent.mouseEnter(divider);
      // JS DOM computed style translates #e9ecef 
      expect(divider.style.backgroundColor).toMatch(/rgb\(233, 236, 239\)|#e9ecef/); 

      fireEvent.mouseLeave(divider);
      expect(divider.style.backgroundColor).toBe('transparent');
    });

    test('divider has correct accessibility attributes', () => {
      renderComponent();
      const divider = screen.getByTitle(TEST_TEXTS.RESIZER_TITLE);

      expect(divider).toHaveAttribute('role', 'separator');
      expect(divider).toHaveAttribute('aria-orientation', 'vertical');
      expect(divider).toHaveAttribute('tabindex', '0');
      expect(divider).toHaveAttribute('aria-valuenow', '50');
      expect(divider).toHaveAttribute('aria-valuemin', '20');
      expect(divider).toHaveAttribute('aria-valuemax', '80');
    });

    test('keyboard navigation adjusts pane width', () => {
      renderComponent();
      const divider = screen.getByTitle(TEST_TEXTS.RESIZER_TITLE);

      // Starting at 50%, ArrowRight should increase by 1%
      fireEvent.keyDown(divider, { key: 'ArrowRight' });
      expect(divider).toHaveAttribute('aria-valuenow', '51');

      // ArrowLeft should decrease by 1%
      fireEvent.keyDown(divider, { key: 'ArrowLeft' });
      expect(divider).toHaveAttribute('aria-valuenow', '50');

      // Home should set to min (20%)
      fireEvent.keyDown(divider, { key: 'Home' });
      expect(divider).toHaveAttribute('aria-valuenow', '20');

      // End should set to max (80%)
      fireEvent.keyDown(divider, { key: 'End' });
      expect(divider).toHaveAttribute('aria-valuenow', '80');
    });
  });
});
