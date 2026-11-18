import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import Header from 'src/components/Header/Header';

jest.mock('src/utils/roomUtils', () => ({ getCurrentRoomName: () => null }));

const renderHeader = (props: Partial<React.ComponentProps<typeof Header>> = {}) =>
    render(
        <MemoryRouter>
            <Header
                isLoggedIn={false}
                isTeacherAuthenticated={false}
                isAdmin={false}
                handleLogout={jest.fn()}
                {...props}
            />
        </MemoryRouter>
    );

describe('Header - Nouveautés', () => {
    test('shows the Nouveautés button to logged-in teachers', () => {
        renderHeader({ isLoggedIn: true, isTeacherAuthenticated: true });
        expect(screen.getByRole('button', { name: /^nouveautés/i })).toBeInTheDocument();
    });

    test('hides it when not logged in as a teacher', () => {
        renderHeader({ isLoggedIn: true, isTeacherAuthenticated: false });
        expect(screen.queryByRole('button', { name: /nouveautés/i })).not.toBeInTheDocument();
    });
});
