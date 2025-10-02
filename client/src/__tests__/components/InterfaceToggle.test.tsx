import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import InterfaceToggle from 'src/components/InterfaceToggle/InterfaceToggle';

// Mock react-router-dom
const mockNavigate = jest.fn();
const mockLocation = {
    pathname: '/teacher/dashboard-v2',
    search: '?someParam=value'
};

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
}));

describe('InterfaceToggle Component', () => {
    const mockOnToggle = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Teacher Dashboard Toggle', () => {
        it('should display V2 chip when current version is v2', () => {
            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v2" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            expect(screen.getByText('Interface V2')).toBeInTheDocument();
        });

        it('should display V1 chip when current version is v1', () => {
            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v1" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            expect(screen.getByText('Interface V1')).toBeInTheDocument();
        });

        it('should navigate from v2 dashboard to v1 dashboard when toggling', () => {
            mockLocation.pathname = '/teacher/dashboard-v2';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v2" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard?someParam=value');
            expect(mockOnToggle).toHaveBeenCalled();
        });

        it('should navigate from v1 dashboard to v2 dashboard when toggling', () => {
            mockLocation.pathname = '/teacher/dashboard';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v1" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard-v2?someParam=value');
            expect(mockOnToggle).toHaveBeenCalled();
        });

        it('should navigate without query params when there are none', () => {
            mockLocation.pathname = '/teacher/dashboard-v2';
            mockLocation.search = '';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v2" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/dashboard');
        });
    });

    describe('Other Routes', () => {
        beforeEach(() => {
            mockLocation.search = '?someParam=value';
        });

        it('should handle student join room toggle', () => {
            mockLocation.pathname = '/student/join-room';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v1" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/student/join-room-v2?someParam=value');
        });

        it('should handle editor quiz toggle', () => {
            mockLocation.pathname = '/teacher/editor-quiz/123';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v1" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/editor-quiz-v2/123?someParam=value');
        });

        it('should handle manage room toggle from v2 to v1', () => {
            mockLocation.pathname = '/teacher/manage-room-v2/quiz123';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v2" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/manage-room/quiz123/default?someParam=value');
        });

        it('should handle manage room toggle from v1 to v2', () => {
            mockLocation.pathname = '/teacher/manage-room/quiz123/roomName';

            render(
                <MemoryRouter>
                    <InterfaceToggle currentVersion="v1" onToggle={mockOnToggle} />
                </MemoryRouter>
            );

            const toggleButton = screen.getByRole('button');
            fireEvent.click(toggleButton);

            expect(mockNavigate).toHaveBeenCalledWith('/teacher/manage-room-v2/quiz123?someParam=value');
        });
    });
});