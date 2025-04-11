import { render, screen, waitFor, act, fireEvent, within } from '@testing-library/react';
import Users from '../../../pages/Admin/Users';
import ApiService from '../../../services/ApiService';
import '@testing-library/jest-dom';
import { AdminTableType } from '../../../Types/AdminTableType';
import React from 'react';

jest.mock('../../../services/ApiService');
jest.mock('../../../components/AdminTable/AdminTable', () => ({
    __esModule: true,
    default: ({ data, onDelete }: any) => (
      <table>
      <thead>
        <tr>
          <th>Enseignant</th>
          <th>Email</th>
          <th>Actions</th>
        </tr>
      </thead>
        <tbody>
          {data.map((user: any) => (
            <tr key={user.email}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <button onClick={() => onDelete(user)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
}));

describe('Users Component', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

  it('renders users after fetching data', async () => {
    const mockUsers: AdminTableType[] = [
      { _id: '1', name: 'John Doe', email: 'john.doe@example.com', created_at: new Date('2021-01-01'), roles: ['admin'] },
      { _id: '2', name: 'Jane Smith', email: 'jane.smith@example.com', created_at: new Date('2021-02-01'), roles: ['user'] },
    ];

    (ApiService.getUsers as jest.Mock).mockResolvedValueOnce(mockUsers);


    await act(async () => {
        render(<Users />);
    });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    });
  });

  it('handles delete user action', async () => {
    const mockUsers: AdminTableType[] = [];

    (ApiService.getUsers as jest.Mock).mockResolvedValueOnce(mockUsers);

    await act(async () => {
        render(<Users />);
    });

    const columnHeader = screen.getByRole('columnheader', { name: /enseignant/i });
    expect(columnHeader).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('calls handleDelete when delete button is clicked', async () => {

    const mockUsers: AdminTableType[] = [{ _id: '1', name: 'John Doe', email: 'john.doe@example.com', created_at: new Date('2021-01-01'), roles: ['Admin'] }];
    (ApiService.getUsers as jest.Mock).mockResolvedValueOnce(mockUsers);

    await act(async () => {
        render(<Users />);
    });
    
    await waitFor(() => screen.getByText("John Doe"));
    console.log(screen.debug());
    const userRow = screen.getByText("John Doe").closest("tr");
    if (userRow) {
      const deleteButton = within(userRow).getByRole('button');
      fireEvent.click(deleteButton);    
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    }else {
        throw new Error("User row not found");
    }
  });
});
