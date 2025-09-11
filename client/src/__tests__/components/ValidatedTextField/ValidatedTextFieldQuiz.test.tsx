import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';
import validationConstants from '@shared/validationConstants.json';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

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
      const longTitle = 'a'.repeat(validationConstants.quiz.title.maxLength + 1);
      await user.type(input, longTitle);
      fireEvent.blur(input);

      await waitFor(() => {
        // Since the component prevents input beyond maxLength, and valid title is allowed up to maxLength
        expect(input).toHaveValue('a'.repeat(validationConstants.quiz.title.maxLength));
        expect(screen.queryByText(validationConstants.quiz.title.errorMessage)).not.toBeInTheDocument();
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
      const maxLengthContent = 'a'.repeat(validationConstants.quiz.content.maxLength); 
      fireEvent.change(input, { target: { value: maxLengthContent } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).toHaveValue(maxLengthContent);
        expect(screen.queryByText(validationConstants.quiz.content.errorMessage)).not.toBeInTheDocument();
      });
    });

    it('should block input beyond maximum length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="quiz.content" />);

      const input = screen.getByRole('textbox');
      const maxLengthContent = 'a'.repeat(validationConstants.quiz.content.maxLength);

      fireEvent.change(input, { target: { value: maxLengthContent } });
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthContent);
      });

      await user.type(input, 'b');

      await waitFor(() => {
        
        expect(input).toHaveValue(maxLengthContent);
      });
    });
  });
});
