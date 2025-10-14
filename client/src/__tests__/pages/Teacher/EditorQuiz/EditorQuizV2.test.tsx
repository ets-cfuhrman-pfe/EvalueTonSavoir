import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

jest.mock('../../../../components/AutoSaveIndicator/AutoSaveIndicator', () => ({
  __esModule: true,
  default: ({ status, lastSaved }: any) => (
    <div data-testid="auto-save-indicator">
      Status: {status}
      {lastSaved && ` - Last saved: ${lastSaved.toISOString()}`}
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

// Constants
const DEBOUNCE_MS = 2000;
const SCROLL_Y_VALUE = 400;
const DRAFT_TIMESTAMP_OFFSET = 5000;
const WAIT_TIMEOUT = 3000;

const EDITOR_TITLE = 'Éditeur de quiz';
const PREVIEW_TITLE = 'Prévisualisation';
const LOADING_TEXT = 'Chargement du quiz...';
const QUIZ_TITLE_LABEL = 'Titre du quiz';
const FOLDER_LABEL = 'Dossier';
const SAVE_BUTTON_TEXT = /enregistrer$/i;
const SAVE_EXIT_BUTTON_TEXT = /enregistrer et quitter/i;
const TITLE_ERROR_MESSAGE = 'Veuillez saisir un titre pour le quiz';
const FOLDER_ERROR_MESSAGE = 'Veuillez choisir un dossier';
const SAVE_ERROR_MESSAGE = 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.';
const ALERT_ERROR_MESSAGE = 'Une erreur est survenue';
const DRAFT_DETECTED_TITLE = 'Brouillon détecté';
const DRAFT_DETECTED_MESSAGE = /Un brouillon non sauvegardé a été trouvé/;
const RESTORE_DRAFT_BUTTON = 'Restaurer le brouillon';
const IGNORE_DRAFT_BUTTON = 'Ignorer le brouillon';
const SCROLL_TO_TOP_TITLE = 'Scroll to top';
const MARKDOWN_LINK_TEXT = /\[markdown\]/;
const TEST_FOLDER_NAME = 'Test Folder';

const EDITOR_V2_TEST_ID = 'editor-v2';
const GIFT_CHEAT_SHEET_TEST_ID = 'gift-cheat-sheet';
const GIFT_PREVIEW_TEST_ID = 'gift-preview';
const EDITOR_TEXTAREA_TEST_ID = 'editor-textarea';
const AUTO_SAVE_INDICATOR_TEST_ID = 'auto-save-indicator';
const IMAGE_GALLERY_MODAL_TEST_ID = 'image-gallery-modal';
const VALIDATED_TEXT_FIELD_TITLE = 'validated-text-field-quiz.title';

const QUIZ_DRAFT_KEY_NEW = 'quiz-draft-new';
const QUIZ_TITLE_JSON = '"quizTitle":"Test Quiz Title"';
const CONTENT_JSON = '"content":"Test question content"';
const CONTENT_CHANGE_JSON = '"content":"Change 3"';

// Mock localStorage for auto-save tests
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

const mockNavigate = jest.fn();
const mockUseParams = jest.fn();
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

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

  // Mock localStorage with the shared mock
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
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

      expect(screen.getByText(EDITOR_TITLE)).toBeInTheDocument();
      expect(screen.getByText(PREVIEW_TITLE)).toBeInTheDocument();
      expect(screen.getByTestId(EDITOR_V2_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(GIFT_CHEAT_SHEET_TEST_ID)).toBeInTheDocument();
      expect(screen.getByTestId(GIFT_PREVIEW_TEST_ID)).toBeInTheDocument();
    });

    test('shows loading state for existing quiz', () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'existing-quiz-id' });
      // Mock getQuiz to return a promise that never resolves to simulate loading
      mockApiService.getQuiz.mockReturnValue(new Promise(() => {}));

      renderComponent(['/teacher/editor-quiz/existing-quiz-id']);

      expect(screen.getByText(LOADING_TEXT)).toBeInTheDocument();
    });

    test('renders quiz configuration form', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: TEST_FOLDER_NAME, created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);

      renderComponent();

      // Wait for the component to render and folders to load
      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Check the basic components are there
      expect(screen.getByText(EDITOR_TITLE)).toBeInTheDocument();
      
      // Check for the form elements with more specific queries
      const titleLabel = screen.getByLabelText(QUIZ_TITLE_LABEL);
      expect(titleLabel).toBeInTheDocument();
      
      const folderLabel = screen.getByLabelText(FOLDER_LABEL);
      expect(folderLabel).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    test('updates quiz title when input changes', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
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

      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);
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
        { _id: 'folder1', userId: 'user1', title: TEST_FOLDER_NAME, created_at: '2023-01-01' },
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
      }, { timeout: WAIT_TIMEOUT });

      // check for the alert and navigation
      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining(ALERT_ERROR_MESSAGE)
        );
        expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
      }, { timeout: WAIT_TIMEOUT });

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
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'New Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText(FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      
      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
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

      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Updated Quiz' } });

      
      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
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
        const select = screen.getByLabelText(FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(TITLE_ERROR_MESSAGE)).toBeInTheDocument();
      }, { timeout: WAIT_TIMEOUT });
    });

    test('shows error when saving without folder', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      // Fill title but leave folder empty
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(FOLDER_ERROR_MESSAGE)).toBeInTheDocument();
      }, { timeout: WAIT_TIMEOUT });
    });
  });

  describe('User Interactions', () => {
    test('scrolls to top when button is clicked', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      // Simulate scroll by setting scrollY and triggering scroll event
      Object.defineProperty(window, 'scrollY', { value: SCROLL_Y_VALUE });
      window.dispatchEvent(new Event('scroll'));

      // Wait for the button to appear
      const scrollButton = await screen.findByTitle(SCROLL_TO_TOP_TITLE);
      fireEvent.click(scrollButton);

      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    test('copies image link to clipboard', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      const galleryButton = screen.getByTestId(IMAGE_GALLERY_MODAL_TEST_ID);
      fireEvent.click(galleryButton);

      // Click on the generated image link
      const imageLinkButton = await screen.findByText(MARKDOWN_LINK_TEXT);
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
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      // Wait for folders to load and select to be available
      await waitFor(() => {
        const select = screen.getByLabelText(FOLDER_LABEL);
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByLabelText(FOLDER_LABEL);
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Test Folder'));

      // Click save and exit
      const saveExitButton = screen.getByRole('button', { name: SAVE_EXIT_BUTTON_TEXT });
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
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      const select = screen.getByRole('combobox', { name: FOLDER_LABEL });
      fireEvent.mouseDown(select);
      
      // Wait for the option to be available
      await waitFor(() => {
        const option = screen.getByText('Test Folder');
        fireEvent.click(option);
      });

      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(SAVE_ERROR_MESSAGE)).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Save Functionality', () => {
    // Enable fake timers for auto-save tests
    beforeEach(() => {
      jest.useFakeTimers();
      mockLocalStorage.clear();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    test('should show auto-save indicator in header', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId(AUTO_SAVE_INDICATOR_TEST_ID)).toBeInTheDocument();
      });
    });

    test('should auto-save quiz content after debounce period', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill in some content
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz Title' } });

      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);
      fireEvent.change(editorTextarea, { target: { value: 'Test question content' } });

      // Advance time to trigger auto-save
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      // Check that localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        QUIZ_DRAFT_KEY_NEW,
        expect.stringContaining(QUIZ_TITLE_JSON)
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        QUIZ_DRAFT_KEY_NEW,
        expect.stringContaining(CONTENT_JSON)
      );
    });

    test('should update auto-save status during save process', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill in content
      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);
      fireEvent.change(editorTextarea, { target: { value: 'Test content' } });

      // Check initial status
      let indicator = screen.getByTestId(AUTO_SAVE_INDICATOR_TEST_ID);
      expect(indicator).toHaveTextContent('Status: idle');

      // Advance time to trigger save
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      // Should show saved status
      indicator = screen.getByTestId(AUTO_SAVE_INDICATOR_TEST_ID);
      expect(indicator).toHaveTextContent('Status: saved');
    });

    test('should debounce multiple rapid changes', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);

      // Make multiple rapid changes
      fireEvent.change(editorTextarea, { target: { value: 'Change 1' } });
      fireEvent.change(editorTextarea, { target: { value: 'Change 2' } });
      fireEvent.change(editorTextarea, { target: { value: 'Change 3' } });

      // Advance time
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      // Should only save once with the latest content
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        QUIZ_DRAFT_KEY_NEW,
        expect.stringContaining(CONTENT_CHANGE_JSON)
      );
    });

    test('should clear draft after successful manual save', async () => {
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });
      const mockFolders: FolderType[] = [
        { _id: 'folder1', userId: 'user1', title: TEST_FOLDER_NAME, created_at: '2023-01-01' },
      ];
      mockApiService.getUserFolders.mockResolvedValue(mockFolders);
      mockApiService.createQuiz.mockResolvedValue({ success: true } as any);

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill form
      const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
      fireEvent.change(titleInput, { target: { value: 'Test Quiz' } });

      // Wait for folders to be loaded before opening dropdown
      await waitFor(() => {
        const folderSelect = screen.getByRole('combobox', { name: FOLDER_LABEL });
        expect(folderSelect).toBeInTheDocument();
      });

      const folderSelect = screen.getByRole('combobox', { name: FOLDER_LABEL });
      fireEvent.mouseDown(folderSelect);
      
      await waitFor(() => {
        const option = screen.getByText(TEST_FOLDER_NAME);
        fireEvent.click(option);
      });

      // Trigger auto-save first
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();

      // Manual save
      const saveButton = screen.getByRole('button', { name: SAVE_BUTTON_TEXT });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiService.createQuiz).toHaveBeenCalled();
      });

      // Draft should be cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(QUIZ_DRAFT_KEY_NEW);
    });

    test('should handle localStorage errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Fill in content
      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);
      fireEvent.change(editorTextarea, { target: { value: 'Test content' } });

      // Advance time to trigger save
      act(() => {
        jest.advanceTimersByTime(DEBOUNCE_MS);
      });

      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save draft:', expect.any(Error));

      // Auto-save indicator should show error
      const indicator = screen.getByTestId(AUTO_SAVE_INDICATOR_TEST_ID);
      expect(indicator).toHaveTextContent('Status: error');

      consoleSpy.mockRestore();
    });
  });

  describe('Draft Restoration', () => {
    beforeEach(() => {
      mockLocalStorage.clear();
    });

    test('should show draft restoration dialog when draft exists', async () => {
      const existingDraft = {
        quizTitle: 'Draft Quiz',
        selectedFolder: 'folder1',
        content: 'Draft content',
        timestamp: Date.now() - DRAFT_TIMESTAMP_OFFSET
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDraft));
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(DRAFT_DETECTED_TITLE)).toBeInTheDocument();
      });

      expect(screen.getByText(DRAFT_DETECTED_MESSAGE)).toBeInTheDocument();
      expect(screen.getByText(RESTORE_DRAFT_BUTTON)).toBeInTheDocument();
      expect(screen.getByText(IGNORE_DRAFT_BUTTON)).toBeInTheDocument();
    });

    test('should restore draft when user clicks restore button', async () => {
      const existingDraft = {
        quizTitle: 'Draft Quiz Title',
        selectedFolder: 'folder1',
        content: 'Draft quiz content',
        timestamp: Date.now() - DRAFT_TIMESTAMP_OFFSET
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDraft));
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(DRAFT_DETECTED_TITLE)).toBeInTheDocument();
      });

      // Click restore button
      const restoreButton = screen.getByText(RESTORE_DRAFT_BUTTON);
      fireEvent.click(restoreButton);

      // Wait for dialog to close
      await waitFor(() => {
        expect(screen.queryByText(DRAFT_DETECTED_TITLE)).not.toBeInTheDocument();
      }, { timeout: WAIT_TIMEOUT });

      // Check that form fields are populated
      await waitFor(() => {
        const titleInput = screen.getByTestId(VALIDATED_TEXT_FIELD_TITLE);
        expect(titleInput).toHaveValue('Draft Quiz Title');
      });

      const editorTextarea = screen.getByTestId(EDITOR_TEXTAREA_TEST_ID);
      expect(editorTextarea).toHaveValue('Draft quiz content');
    });

    test('should discard draft when user clicks ignore button', async () => {
      const existingDraft = {
        quizTitle: 'Draft Quiz',
        selectedFolder: 'folder1',
        content: 'Draft content',
        timestamp: Date.now() - DRAFT_TIMESTAMP_OFFSET
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDraft));
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(DRAFT_DETECTED_TITLE)).toBeInTheDocument();
      });

      // Click ignore button
      const ignoreButton = screen.getByText(IGNORE_DRAFT_BUTTON);
      fireEvent.click(ignoreButton);

      // Check that draft is cleared
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(QUIZ_DRAFT_KEY_NEW);

      // Dialog should be closed
      await waitFor(() => {
        expect(screen.queryByText(DRAFT_DETECTED_TITLE)).not.toBeInTheDocument();
      });
    });

    test('should handle corrupted draft data gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json-data');
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'new' });

      renderComponent();

      await waitFor(() => {
        expect(mockApiService.getUserFolders).toHaveBeenCalled();
      });

      // Should not show draft dialog for corrupted data
      expect(screen.queryByText('Brouillon détecté')).not.toBeInTheDocument();
    });

    test('should not show draft dialog for existing quiz until quiz loads', async () => {
      const existingDraft = {
        quizTitle: 'Draft Quiz',
        selectedFolder: 'folder1',
        content: 'Draft content',
        timestamp: Date.now() - DRAFT_TIMESTAMP_OFFSET
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingDraft));
      (require('react-router-dom').useParams as jest.Mock).mockReturnValue({ id: 'quiz123' });

      const mockQuiz: QuizType = {
        _id: 'quiz123',
        folderId: 'folder1',
        folderName: 'Test Folder',
        userId: 'user1',
        title: 'Existing Quiz',
        content: ['Existing content'],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockApiService.getQuiz.mockResolvedValue(mockQuiz);

      renderComponent(['/teacher/editor-quiz/quiz123']);

      // Should not show dialog immediately
      expect(screen.queryByText(DRAFT_DETECTED_TITLE)).not.toBeInTheDocument();

      // Wait for quiz to load
      await waitFor(() => {
        expect(mockApiService.getQuiz).toHaveBeenCalledWith('quiz123');
      });

      // Now should show draft dialog
      await waitFor(() => {
        expect(screen.getByText(DRAFT_DETECTED_TITLE)).toBeInTheDocument();
      });
    });
  });
});
