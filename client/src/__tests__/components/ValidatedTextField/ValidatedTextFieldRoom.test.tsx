// Mock the @shared import before importing ValidationService
jest.mock('@shared/validationConstants.json', () => ({
  room: {
    name: {
      minLength: 1,
      maxLength: 25,
      pattern: '^[a-zA-Z0-9\\-_\\s]+$',
      errorMessage: 'Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces'
    }
  }
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

describe('ValidatedTextField - Room Entity', () => {
  const defaultProps = {
    fieldPath: 'room.name',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Name Validation', () => {
    it('should accept valid room name', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Ma Salle 123');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should accept room name with letters, numbers, hyphens, underscores and spaces', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Test-Room_123');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should accept minimum length room name', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'A');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should accept maximum length room name', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const maxLengthName = 'A'.repeat(25); // Exactly 25 characters
      await user.type(input, maxLengthName);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject empty room name when required', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} required />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ est requis')).toBeInTheDocument();
      });
    });

    it('should handle room name longer than maximum length without showing error', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const longName = 'A'.repeat(26); // 26 characters, max is 25
      await user.type(input, longName);
      fireEvent.blur(input);

      await waitFor(() => {
        // Since the component prevents input beyond maxLength, no error should be shown
        expect(input).toHaveValue('A'.repeat(25)); // Should be truncated to maxLength
        expect(screen.queryByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).not.toBeInTheDocument();
      });
    });

    it('should reject room name with invalid characters', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Salle@#$%');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
      });
    });

    it('should reject room name with special characters like @', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Salle@Test');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
      });
    });

    it('should reject room name with exclamation marks', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Salle!');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
      });
    });

    it('should prevent typing beyond maximum length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      const longName = 'A'.repeat(26); // 26 characters
      
      await user.type(input, longName);
      
      // The input should be truncated to maxLength
      expect(input).toHaveValue('A'.repeat(25));
    });

    it('should show error message on blur when validation fails', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Salle@Invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
      });
    });

    it('should clear error when valid input is entered after invalid', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} />);

      const input = screen.getByRole('textbox');
      
      // Enter invalid input
      await user.type(input, 'Salle@Invalid');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
      });

      // Clear and enter valid input
      await user.clear(input);
      await user.type(input, 'Salle Valide');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).not.toBeInTheDocument();
      });
    });
  });
});
