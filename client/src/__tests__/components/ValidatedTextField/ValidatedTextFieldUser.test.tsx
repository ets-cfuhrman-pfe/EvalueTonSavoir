import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

// Mock VALIDATION_CONSTANTS
jest.mock('@shared/validationConstants.json', () => ({
  user: {
    email: {
      minLength: 3,
      maxLength: 64,
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      errorMessage: "L'adresse email doit être valide"
    },
    password: {
      minLength: 8,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$',
      errorMessage: 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    },
    username: {
      minLength: 2,
      maxLength: 25,
      pattern: '^[a-zA-Z0-9]+$',
      errorMessage: "Le nom d'utilisateur ne peut contenir que des lettres et des chiffres"
    }
  }
}));

describe('ValidatedTextField - User Entity', () => {
  const defaultProps = {
    fieldPath: 'user.email',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Email (user.email)', () => {
    it('should accept valid email', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'test@example.com');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject invalid email format', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid-email');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText("L'adresse email doit être valide")).toBeInTheDocument();
      });
    });

    it('should reject email shorter than min length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a@b'); // 3 chars, min is 3 but invalid format
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText("L'adresse email doit être valide")).toBeInTheDocument();
      });
    });

    it('should reject email longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      const longEmail = 'a'.repeat(60) + '@example.com'; // Total > 64 chars
      await user.type(input, longEmail);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText("L'adresse email doit être valide")).toBeInTheDocument();
      });
    });
  });

  // User Password validation tests removed - password validation now handled by third-party SSO
  // describe('User Password (user.password)', () => {
  //   Tests commented out as local password validation has been removed
  //   in favor of third-party SSO authentication
  // });

  describe('User Username (user.username)', () => {
    it('should accept valid username', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'validuser123');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject username with invalid characters', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'invalid_user!');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText("Le nom d'utilisateur ne peut contenir que des lettres et des chiffres")).toBeInTheDocument();
      });
    });

    it('should reject username shorter than min length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a'); // 1 char, min is 2
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ doit contenir au moins 2 caractères')).toBeInTheDocument();
      });
    });

    it('should reject username longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');

      // First set to exactly maxLength
      const maxLengthUsername = 'a'.repeat(25); // 25 chars, max is 25
      fireEvent.change(input, { target: { value: maxLengthUsername } });

      // Verify it accepts the maxLength username
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthUsername);
        expect(input).toHaveAttribute('maxlength', '25');
      });

      // Try to add more characters - this should be blocked
      await user.type(input, 'b');

      // Value should remain at maxLength
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthUsername);
      });
    });
  });
});
