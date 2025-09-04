import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

// Mock VALIDATION_CONSTANTS
jest.mock('@shared/validationConstants.json', () => ({
  numerical: {
    answer: {
      min: -1000000,
      max: 1000000,
      errorMessage: 'La réponse doit être un nombre entre -1000000 et 1000000'
    }
  }
}));

describe('ValidatedTextField - Numerical Entity', () => {
  const defaultProps = {
    fieldPath: 'numerical.answer',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Numerical Answer (numerical.answer)', () => {
    it('should accept valid numerical answer', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      await user.type(input, '12345');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should accept negative numerical answer', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      await user.type(input, '-50000');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject non-numerical input', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'not-a-number');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('La valeur doit être un nombre')).toBeInTheDocument();
      });
    });

    it('should reject numerical answer below minimum', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      await user.type(input, '-1000001'); // Below min of -1000000
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('La valeur doit être supérieure ou égale à -1000000')).toBeInTheDocument();
      });
    });

    it('should reject numerical answer above maximum', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      await user.type(input, '1000001'); // Above max of 1000000
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('La valeur doit être inférieure ou égale à 1000000')).toBeInTheDocument();
      });
    });
  });
});
