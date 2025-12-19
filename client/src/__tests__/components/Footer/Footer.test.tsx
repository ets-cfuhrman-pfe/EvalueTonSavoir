import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../../../components/Footer/Footer';

// Mock ENV_VARIABLES
jest.mock('../../../constants', () => ({
    ENV_VARIABLES: {
        VITE_BACKEND_URL: 'http://localhost:3000'
    }
}));

// Mock package.json
jest.mock('../../../../package.json', () => ({
    version: '1.2.3'
}));

describe('Footer Component', () => {
    beforeEach(() => {
        // Reset fetch mock before each test
        global.fetch = jest.fn(() => Promise.resolve({
            json: () => Promise.resolve({ version: '0.0.0' })
        })) as jest.Mock;
    });

    it('renders frontend version', () => {
        render(<Footer />);
        expect(screen.getByText(/Frontend v1.2.3/)).toBeInTheDocument();
    });

    it('fetches and renders backend version', async () => {
        const mockBackendVersion = '4.5.6';
        (global.fetch as jest.Mock).mockResolvedValue({
            json: jest.fn().mockResolvedValue({ version: mockBackendVersion }),
        });

        render(<Footer />);

        await waitFor(() => {
            expect(screen.getByText(`Backend v${mockBackendVersion}`)).toBeInTheDocument();
        });
        
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3000/api/version');
    });

    it('handles fetch error gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(<Footer />);

        // Should still render frontend version
        expect(screen.getByText(/Frontend v1.2.3/)).toBeInTheDocument();
        
        // Should not render backend version
        // We wait a bit to ensure the effect has run and failed
        await waitFor(() => {
             expect(global.fetch).toHaveBeenCalled();
        });
        expect(screen.queryByText(/Backend v/)).not.toBeInTheDocument();

        consoleSpy.mockRestore();
    });
});
