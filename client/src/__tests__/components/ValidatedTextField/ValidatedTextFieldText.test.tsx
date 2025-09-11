import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';
import validationConstants from '@shared/validationConstants.json';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

describe('ValidatedTextField - Text Entity', () => {
  const defaultProps = {
    fieldPath: 'text.short',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Short Text (text.short)', () => {
    it('should accept valid short text', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="text.short" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Valid short text');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject short text longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="text.short" />);

      const input = screen.getByRole('textbox');

     
      const maxLengthText = 'a'.repeat(validationConstants.text.short.maxLength);
      fireEvent.change(input, { target: { value: maxLengthText } });

     
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthText);
        expect(input).toHaveAttribute('maxlength', String(validationConstants.text.short.maxLength));
      });

      // Try to add one more character - this should be blocked by HTML maxlength
      await user.type(input, 'b');

      // The value should remain at maxLength
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthText);
      });
    });
  });

  describe('Long Text (text.long)', () => {
    it('should accept valid long text', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="text.long" />);

      const input = screen.getByRole('textbox');
      await user.type(input, 'Valid long text content');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(input).not.toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should reject long text longer than max length', async () => {
      const user = userEvent.setup();
      render(<ValidatedTextField {...defaultProps} fieldPath="text.long" />);

      const input = screen.getByRole('textbox');

      
      const maxLengthText = 'a'.repeat( validationConstants.text.long.maxLength);
      fireEvent.change(input, { target: { value: maxLengthText } });

   
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthText);
        expect(input).toHaveAttribute('maxlength', String(validationConstants.text.long.maxLength));
      });

      // Try to add one more character - this should be blocked by HTML maxlength
      await user.type(input, 'b');

      // The value should remain at maxLength
      await waitFor(() => {
        expect(input).toHaveValue(maxLengthText);
      });
    });
  });
});
