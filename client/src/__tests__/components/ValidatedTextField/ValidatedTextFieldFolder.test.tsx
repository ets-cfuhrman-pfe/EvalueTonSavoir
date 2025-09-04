import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

// Mock VALIDATION_CONSTANTS
jest.mock('@shared/validationConstants.json', () => ({
  folder: {
    title: {
      minLength: 1,
      maxLength: 64,
      pattern: '^[a-zA-Z0-9\\u00C0-\\u017F\\s\\-_]+$',
      errorMessage: 'Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores'
    }
  }
}));

describe('ValidatedTextField - Folder Entity', () => {
  const defaultProps = {
    fieldPath: 'folder.title',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Folder Title (folder.title)', () => {
    it('should accept valid folder title', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="folder.title" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Valid Folder Title 123');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject empty folder title', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="folder.title" />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ est requis')).toBeInTheDocument();
      });
    });

    it('should reject folder title with invalid characters', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="folder.title" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Invalid@Folder!');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores')).toBeInTheDocument();
      });
    });

    it('should handle folder title at maximum length without error', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="folder.title" />);

      const input = screen.getByRole('textbox');
      const longTitle = 'a'.repeat(65); // 65 chars, but will be truncated to 64
      await user.type(input, longTitle);
      fireEvent.blur(input);

      await waitFor(() => {
        // Since the component prevents input beyond maxLength, and valid chars are allowed up to maxLength
        expect(input).toHaveValue('a'.repeat(64));
        expect(screen.queryByText('Le titre ne peut contenir que des lettres, chiffres, espaces, tirets et underscores')).not.toBeInTheDocument();
      });
    });
  });
});
