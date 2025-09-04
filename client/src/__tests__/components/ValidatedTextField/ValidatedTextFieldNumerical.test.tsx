import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

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
        expect(screen.getByText('Cette valeur ne peut contenir que des chiffres')).toBeInTheDocument();
      });
    });

    it('should reject non-numerical input when set via props', async () => {
      // Test validation when value is set via initialValue prop (bypasses typing/blocking)
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" initialValue="abc" />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('Cette valeur ne peut contenir que des chiffres')).toBeInTheDocument();
      });
    });

    it('should reject overly long input when set via props', async () => {
      // Test validation when value is set via initialValue prop (bypasses character length truncation)
      const longValue = '1234567890123456789012345'; // 25 characters, exceeds maxLength of 20
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" initialValue={longValue} />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('La réponse ne peut pas dépasser 20 caractères')).toBeInTheDocument();
      });
    });

    it('should allow scientific notation like 12e3', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      
      // Try to type scientific notation
      await user.type(input, '12e3');
      expect(input).toHaveValue('12e3');

      // Should not show any validation errors
      fireEvent.blur(input);
      await waitFor(() => {
        expect(screen.queryByText(/La réponse/)).not.toBeInTheDocument();
      });
    });

    it('should allow complex scientific notation like 12e34', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      
      // Try to type complex scientific notation
      await user.type(input, '12e34');
      expect(input).toHaveValue('12e34');

      // Should not show any validation errors
      fireEvent.blur(input);
      await waitFor(() => {
        expect(screen.queryByText(/La réponse/)).not.toBeInTheDocument();
      });
    });

    it('should truncate overly long numerical input to prevent infinite decimal abuse', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      
      // Check that the HTML maxlength attribute is set correctly
      expect(input).toHaveAttribute('maxlength', '20');
      
      // Try to type a very long decimal number that would never reach the numerical limit
      // but has way too many characters (maxLength is 20)
      const longDecimal = '0.123456789012345678901234567890'; // 32 characters, exceeds maxLength of 20
      
      await user.type(input, longDecimal);

      await waitFor(() => {
        // The input should be truncated to maxLength (20 characters)
        const inputValue = (input as HTMLInputElement).value;
        // Just check that it's not longer than 20 characters
        expect(inputValue.length).toBeLessThanOrEqual(20);
      });
    });

    it('should allow scientific notation with 2-digit exponents like 12e99', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      
      // Try to type scientific notation with maximum allowed exponent
      await user.type(input, '12e99');
      expect(input).toHaveValue('12e99');

      // Should not show any validation errors
      fireEvent.blur(input);
      await waitFor(() => {
        expect(screen.queryByText(/La réponse/)).not.toBeInTheDocument();
      });
    });

    it('should block overly long scientific notation exponents during typing', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" />);

      const input = screen.getByRole('textbox');
      
      // Type valid scientific notation first
      await user.type(input, '12e34');
      expect(input).toHaveValue('12e34');

      // Try to add more digits to the exponent - should be blocked
      await user.type(input, '5');  // This would make it 12e345, which should be blocked
      
      // The input should still contain the previous valid value
      expect(input).toHaveValue('12e34');
    });

    it('should reject overly long scientific notation exponents', async () => {
      // Test validation when value is set via initialValue prop
      render(<ValidatedTextField {...defaultProps} fieldPath="numerical.answer" initialValue="12e123" />);

      const input = screen.getByRole('textbox');
      fireEvent.blur(input); // Trigger validation

      await waitFor(() => {
        expect(screen.getByText('Cette valeur ne peut contenir que des chiffres')).toBeInTheDocument();
      });
    });
  });
});
