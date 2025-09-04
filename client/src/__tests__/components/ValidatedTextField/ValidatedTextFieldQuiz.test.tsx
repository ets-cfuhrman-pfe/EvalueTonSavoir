import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

// Mock VALIDATION_CONSTANTS
jest.mock('@shared/validationConstants.json', () => ({
  quiz: {
    title: {
      minLength: 1,
      maxLength: 64,
      errorMessage: 'Le titre du quiz doit contenir entre 1 et 64 caractères'
    },
    content: {
      minLength: 1,
      maxLength: 50000,
      errorMessage: 'Le contenu du quiz doit contenir entre 1 et 50000 caractères'
    }
  }
}));

describe('ValidatedTextField - Quiz Entity', () => {
  const defaultProps = {
    fieldPath: 'quiz.title',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quiz Title (quiz.title)', () => {
    it('should accept valid quiz title', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.title" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Valid Quiz Title');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject empty quiz title', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.title" />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ est requis')).toBeInTheDocument();
      });
    });

    it('should handle quiz title at maximum length without error', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.title" />);

      const input = screen.getByRole('textbox');
      const longTitle = 'a'.repeat(65); // 65 chars, but will be truncated to 64
      await user.type(input, longTitle);
      fireEvent.blur(input);

      await waitFor(() => {
        // Since the component prevents input beyond maxLength, and valid title is allowed up to maxLength
        expect(input).toHaveValue('a'.repeat(64));
        expect(screen.queryByText('Le titre du quiz doit contenir entre 1 et 64 caractères')).not.toBeInTheDocument();
      });
    });
  });

  describe('Quiz Content (quiz.content)', () => {
    it('should accept valid quiz content', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.content" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Valid quiz content');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject empty quiz content', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.content" />);

      const input = screen.getByRole('textbox');
      await user.clear(input);
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Ce champ est requis')).toBeInTheDocument();
      });
    });

    it('should handle quiz content at maximum length without error', async () => {
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.content" />);

      const input = screen.getByRole('textbox');
      const maxLengthContent = 'a'.repeat(50000); // Exactly at max length
      fireEvent.change(input, { target: { value: maxLengthContent } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue(maxLengthContent);
        expect(screen.queryByText('Le contenu du quiz doit contenir entre 1 et 50000 caractères')).not.toBeInTheDocument();
      });
    });

    it('should block input beyond maximum length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.content" />);

      const input = screen.getByRole('textbox');
      const maxLengthContent = 'a'.repeat(50000);

      // First set to max length
      fireEvent.change(input, { target: { value: maxLengthContent } });
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthContent);
      });

      // Try to add more characters - this should be blocked
      await user.type(input, 'b');

      await waitFor(() => {
        // Value should remain at max length, no additional characters added
        expect(input).toHaveValue(maxLengthContent);
      });
    });
  });
});
