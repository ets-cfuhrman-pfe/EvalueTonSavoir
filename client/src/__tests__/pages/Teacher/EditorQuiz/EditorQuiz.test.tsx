import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import QuizForm from '../../../../pages/Teacher/EditorQuiz/EditorQuiz';

// Mock localStorage with proper TypeScript types
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    clear: (): void => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'new' }), // Simulate the "new" route
}));

// Mock ApiService
jest.mock('../../../../services/ApiService', () => ({
  getUserFolders: jest.fn(() => Promise.resolve([])), // Mock empty folder list
  getQuiz: jest.fn(),
  createQuiz: jest.fn(),
  updateQuiz: jest.fn(),
  uploadImage: jest.fn(),
}));

describe('QuizForm Component', () => {
  test('renders QuizForm with default state for a new quiz', async () => {
    render(
      <MemoryRouter initialEntries={['/teacher/editor-quiz/new']}>
        <QuizForm />
      </MemoryRouter>
    );

    // Wait for the component to render the title
    await waitFor(() => {
      expect(screen.getByText('Éditeur de Quiz')).toBeInTheDocument();
    });

    // Check for other expected elements
    expect(screen.getByText('Prévisualisation')).toBeInTheDocument();
  });
});