import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';
import validationConstants from '@shared/validationConstants.json';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

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
        expect(screen.getByText(validationConstants.user.email.errorMessage)).toBeInTheDocument();
      });
    });

    it('should reject email shorter than min length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a@b');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(validationConstants.user.email.errorMessage)).toBeInTheDocument();
      });
    });

    it('should reject email longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.email" />);

      const input = screen.getByRole('textbox');
      const longEmail = 'a'.repeat(validationConstants.user.email.maxLength) + '@example.com'; 
      await user.type(input, longEmail);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(validationConstants.user.email.errorMessage)).toBeInTheDocument();
      });
    });
  });

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
        expect(screen.getByText(validationConstants.user.username.errorMessage)).toBeInTheDocument();
      });
    });

    it('should reject username shorter than min length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'a'); 
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ doit contenir au moins 2 caractères')).toBeInTheDocument();
      });
    });

    it('should reject username longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="user.username" />);

      const input = screen.getByRole('textbox');

    
      const maxLengthUsername = 'a'.repeat(validationConstants.user.username.maxLength); 
      fireEvent.change(input, { target: { value: maxLengthUsername } });

    
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthUsername);
        expect(input).toHaveAttribute('maxlength', String(validationConstants.user.username.maxLength));
      });

      await user.type(input, 'b');

      await waitFor(() => {
        expect(input).toHaveValue(maxLengthUsername);
      });
    });
  });
});
