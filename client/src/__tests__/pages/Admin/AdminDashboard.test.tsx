import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDashboard from '../../../pages/Admin/AdminDashboard';
import ApiService from '../../../services/ApiService';

// Mock the ApiService
jest.mock('../../../services/ApiService');
const mockApiService = ApiService as jest.Mocked<typeof ApiService>;

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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
    name: 'Alice Dupont',
    email: 'alice@example.com',
    roles: [roleTeacher],
    createdAt: '2024-05-13T12:00:00.000Z'
  };

  const user2 = {
    _id: '2',
    name: 'Bob Martin',
    email: 'bob@example.com',
    roles: [roleAdmin, roleTeacher],
    createdAt: null
  };

  const userWithoutRoles = {
    _id: '3',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    // roles intentionally missing
    createdAt: '2020-01-02T00:00:00.000Z'
  };

  const userWithEmptyRoles = {
    _id: '4',
    name: 'Diana Prince',
    email: 'diana@example.com',
    roles: [],
    createdAt: '2023-06-15T10:30:00.000Z'
  };

  const userWithSpecialChars = {
    _id: '5',
    name: 'José María González',
    email: 'jose.maria@example.com',
    roles: ['teacher'],
    createdAt: '2022-12-25T00:00:00.000Z'
  };

  const usersTop = [user1, user2];
  const usersNoRoles = [userWithoutRoles];
  const usersEmptyRoles = [userWithEmptyRoles];
  const usersSpecialChars = [userWithSpecialChars];
  const usersMixed = [user1, user2, userWithoutRoles, userWithEmptyRoles];

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  test('shows loading state initially', async () => {
    // Keep promise unresolved to ensure loading UI is shown
    mockApiService.getAllUsers.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(headingText)).toBeInTheDocument();
    expect(screen.getByText(loadingText)).toBeInTheDocument();
    const spinner = document.querySelector('.spinner-border');
    expect(spinner).toBeInTheDocument(); // spinner
  });

  test('shows an error when fetching users fails', async () => {
    const errorMessage = 'Network error occurred';
    mockApiService.getAllUsers.mockRejectedValue(new Error(errorMessage));

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(errorMessage)).toBeInTheDocument());
    expect(screen.getByRole('alert')).toHaveClass('alert-danger');
  });

  test('shows generic error message for non-Error objects', async () => {
    mockApiService.getAllUsers.mockRejectedValue('String error');

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Failed to fetch users')).toBeInTheDocument());
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
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
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

  test('handles user with empty roles array', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersEmptyRoles);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${allUsersHeading} (${usersEmptyRoles.length})`)).toBeInTheDocument());

    // No role badges should be present
    expect(screen.queryByText(roleTeacher)).not.toBeInTheDocument();
    expect(screen.queryByText(roleAdmin)).not.toBeInTheDocument();
  });

  test('handles users with special characters in names', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersSpecialChars);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(userWithSpecialChars.name)).toBeInTheDocument());
    expect(screen.getByText(userWithSpecialChars.email)).toBeInTheDocument();
  });

  test('clicking user name navigates to user details', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersTop);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(user1.name)).toBeInTheDocument());

    const userNameLink = screen.getByText(user1.name);
    fireEvent.click(userNameLink);

    expect(mockNavigate).toHaveBeenCalledWith(`/admin/user/${user1._id}`, { state: { user: user1 } });
  });

  test('clicking "Voir les détails" button navigates to user details', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersTop);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getAllByText(detailsBtn)).toHaveLength(2));

    const detailsButtons = screen.getAllByText(detailsBtn);
    fireEvent.click(detailsButtons[0]); // Click first button

    expect(mockNavigate).toHaveBeenCalledWith(`/admin/user/${user1._id}`, { state: { user: user1 } });
  });

  test('displays multiple users with mixed data', async () => {
    mockApiService.getAllUsers.mockResolvedValue(usersMixed);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(`${allUsersHeading} (${usersMixed.length})`)).toBeInTheDocument());

    // Check all names are present
    for (const user of usersMixed) {
      expect(screen.getByText(user.name)).toBeInTheDocument();
    }

    // Check role badges appear appropriately
    const teacherBadges = screen.getAllByText(roleTeacher);
    expect(teacherBadges).toHaveLength(2); // Alice and Diana (empty roles still shows nothing)
    expect(screen.getByText(roleAdmin)).toBeInTheDocument();
  });

  test('handles API returning non-array response', async () => {
    mockApiService.getAllUsers.mockResolvedValue(null as any);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(noUsers)).toBeInTheDocument());
  });

  test('handles API returning undefined', async () => {
    mockApiService.getAllUsers.mockResolvedValue(undefined as any);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(noUsers)).toBeInTheDocument());
  });

  test('table has correct structure and accessibility', async () => {
    mockApiService.getAllUsers.mockResolvedValue([user1]);

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());

    // Check table headers
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Courriel')).toBeInTheDocument();
    expect(screen.getByText('Rôles')).toBeInTheDocument();
    expect(screen.getByText('Créé le')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();

    // Check table has proper structure
    const table = screen.getByRole('table');
    expect(table).toHaveClass('table', 'table-striped', 'table-hover');
  });

  test('role badges have correct styling', async () => {
    mockApiService.getAllUsers.mockResolvedValue([user2]); // user with admin and teacher roles

    render(
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(roleAdmin)).toBeInTheDocument());

    const adminBadge = screen.getByText(roleAdmin);
    expect(adminBadge).toHaveClass('badge', 'bg-secondary');

    const teacherBadge = screen.getByText(roleTeacher);
    expect(teacherBadge).toHaveClass('badge', 'bg-secondary');
  });
});
