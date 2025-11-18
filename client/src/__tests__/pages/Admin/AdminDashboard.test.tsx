import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDashboard from '../../../pages/Admin/AdminDashboard';
import ApiService from '../../../services/ApiService';

// Mock the ApiService
jest.mock('../../../services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state first', async () => {
    // Keep promise unresolved to ensure loading UI is shown
    mockApiService.getAllUsers.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText("Tableau d'administration")).toBeInTheDocument();
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  test('shows an error when fetching users fails', async () => {
    mockApiService.getAllUsers.mockRejectedValue(new Error('Boom!'));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Boom!')).toBeInTheDocument());
  });

  test('displays empty state when there are no users', async () => {
    mockApiService.getAllUsers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Aucun utilisateur trouvé.')).toBeInTheDocument();
      expect(screen.getByText('Tous les utilisateurs (0)')).toBeInTheDocument();
    });
  });

  test('displays users list with roles and formatted created date', async () => {
    const user1 = {
      _id: '1',
      name: 'Alice',
      email: 'alice@example.com',
      roles: ['teacher'],
      createdAt: '2024-05-13T12:00:00.000Z'
    };

    const user2 = {
      _id: '2',
      name: 'Bob',
      email: 'bob@example.com',
      roles: ['admin', 'teacher'],
      createdAt: null
    };

    mockApiService.getAllUsers.mockResolvedValue([user1, user2]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Wait for table to render
    await waitFor(() => expect(screen.getByText('Tous les utilisateurs (2)')).toBeInTheDocument());

    // Check names and emails
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('bob@example.com')).toBeInTheDocument();

    // Check roles badges
    expect(screen.getAllByText('teacher').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('admin')).toBeInTheDocument();

    // Created date formatted for user1
    const expectedDate = new Date(user1.createdAt).toLocaleDateString('fr-CA');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();

    // User2 has no createdAt -> shows dash
    expect(screen.getByText('—')).toBeInTheDocument();

    // View details button exists for both
    const detailsButtons = screen.getAllByText('Voir les détails');
    expect(detailsButtons).toHaveLength(2);
  });

  test('handles user with missing roles gracefully', async () => {
    const userWithoutRoles = {
      _id: '3',
      name: 'Charlie',
      email: 'charlie@example.com',
      // roles intentionally missing
      createdAt: '2020-01-02T00:00:00.000Z'
    } as any;

    mockApiService.getAllUsers.mockResolvedValue([userWithoutRoles]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Tous les utilisateurs (1)')).toBeInTheDocument());

    // No role badges should be present for Charlie
    expect(screen.queryByText('teacher')).not.toBeInTheDocument();
    expect(screen.queryByText('admin')).not.toBeInTheDocument();
  });
});
