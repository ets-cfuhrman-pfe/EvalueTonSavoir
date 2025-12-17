import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import Share from '../../../../pages/Teacher/Share/Share.tsx';
import ApiService from '../../../../services/ApiService';
import '@testing-library/jest-dom';

// Mock the ApiService and react-router-dom
jest.mock('../../../../services/ApiService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

describe('Share Component', () => {
  const mockNavigate = jest.fn();
  const mockUseParams = useParams as jest.Mock;
  const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'quiz123' });
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
  });

  const renderComponent = (initialEntries = ['/share/quiz123']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/share/:id" element={<Share />} />
          <Route path="/teacher/dashboard" element={<div>Dashboard</div>} />
          <Route path="/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should show loading state initially', () => {
    mockApiService.getAllQuizIds.mockResolvedValue([]);
    mockApiService.getUserFolders.mockResolvedValue([]);
    mockApiService.getSharedQuiz.mockResolvedValue('Test Quiz');
    
    renderComponent();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('should redirect to login if not authenticated', async () => {
    mockApiService.isLoggedIn.mockReturnValue(false);
    
    renderComponent();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should show "quiz already exists" message when quiz exists', async () => {
    mockApiService.isLoggedIn.mockReturnValue(true);
    mockApiService.getAllQuizIds.mockResolvedValue(['quiz123']);
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Quiz déjà existant')).toBeInTheDocument();
      expect(screen.getByText(/Le quiz que vous essayez d'importer existe déjà sur votre compte/i)).toBeInTheDocument();
      expect(screen.getByText('Retour au tableau de bord')).toBeInTheDocument();
    });
  });

  it('should navigate to dashboard when clicking return button in "quiz exists" view', async () => {
    mockApiService.isLoggedIn.mockReturnValue(true);
    mockApiService.getAllQuizIds.mockResolvedValue(['quiz123']);
    
    renderComponent();
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Retour au tableau de bord'));
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
    });
  });

  it('should show error when no folders exist', async () => {
    mockApiService.isLoggedIn.mockReturnValue(true);
    mockApiService.getAllQuizIds.mockResolvedValue([]);
    mockApiService.getUserFolders.mockResolvedValue([]);
    
    renderComponent();
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2');
    });
  });

});