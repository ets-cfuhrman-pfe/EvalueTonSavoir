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
  const headingText = "Tableau d'administration";
  const loadingText = 'Chargement...';
  const noUsers = 'Aucun utilisateur trouvé.';
  const allUsersHeading = 'Tous les utilisateurs';
  const detailsBtn = 'Voir les détails';
  const roleTeacher = 'teacher';
  const roleAdmin = 'admin';
  const dash = '—';

  // Mock user fixtures
  const user1 = {
    _id: '1',
    name: 'Alice',
    email: 'alice@example.com',
    roles: [roleTeacher],
    createdAt: '2024-05-13T12:00:00.000Z'
  };

  const user2 = {
    _id: '2',
    name: 'Bob',
    email: 'bob@example.com',
    roles: [roleAdmin, roleTeacher],
    createdAt: null
  };

  const userWithoutRoles = {
    _id: '3',
    name: 'Charlie',
    email: 'charlie@example.com',
    // roles intentionally missing
    createdAt: '2020-01-02T00:00:00.000Z'
  } as any;

  const usersTop = [user1, user2];
  const usersNoRoles = [userWithoutRoles];

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

    expect(screen.getByText(headingText)).toBeInTheDocument();
    expect(screen.getByText(loadingText)).toBeInTheDocument();
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
      expect(screen.getByText(noUsers)).toBeInTheDocument();
      expect(screen.getByText(`${allUsersHeading} (0)`)).toBeInTheDocument();
    });
  });

  test('displays users list with roles and formatted created date', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersTop);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    // Wait for table to render
    await waitFor(() => expect(screen.getByText(`${allUsersHeading} (${usersTop.length})`)).toBeInTheDocument());

    // Check names and emails
    expect(screen.getByText(user1.name)).toBeInTheDocument();
    expect(screen.getByText(user1.email)).toBeInTheDocument();
    expect(screen.getByText(user2.name)).toBeInTheDocument();
    expect(screen.getByText(user2.email)).toBeInTheDocument();

    // Check roles badges
    expect(screen.getAllByText(roleTeacher).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(roleAdmin)).toBeInTheDocument();

    // Created date formatted for user1
    const expectedDate = new Date(user1.createdAt).toLocaleDateString('fr-CA');
    expect(screen.getByText(expectedDate)).toBeInTheDocument();

    // User2 has no createdAt
    expect(screen.getByText(dash)).toBeInTheDocument();

    // View details button exists for both
    const detailsButtons = screen.getAllByText(detailsBtn);
    expect(detailsButtons).toHaveLength(2);
  });

  test('handles user with missing roles gracefully', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersNoRoles);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${allUsersHeading} (${usersNoRoles.length})`)).toBeInTheDocument());

    // No role badges should be present for Charlie
    expect(screen.queryByText(roleTeacher)).not.toBeInTheDocument();
    expect(screen.queryByText(roleAdmin)).not.toBeInTheDocument();
  });
});
