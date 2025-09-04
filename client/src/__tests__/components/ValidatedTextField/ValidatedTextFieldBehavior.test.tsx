import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

// Mock ValidationService to avoid dependencies
jest.mock('../../../services/ValidationService');

// Mock VALIDATION_CONSTANTS with all entities
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

describe('ValidatedTextField - Component Behavior', () => {
  const defaultProps = {
    fieldPath: 'room.name',
    initialValue: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call onValueChange callback when value changes', async () => {
    const mockOnValueChange = jest.fn();
    const user = userEvent.setup();
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        onValueChange={mockOnValueChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(mockOnValueChange).toHaveBeenCalledWith('test value', true);
  });

  it('should show initial value', () => {
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        initialValue="initial value"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial value');
  });

  it('should validate on blur when validateOnBlur is true', async () => {
    const user = userEvent.setup();
    render(<ValidatedTextField {...defaultProps} fieldPath="room.name" />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Invalid@Room!');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
    });
  });

  it('should validate on change when validateOnChange is true', async () => {
    const user = userEvent.setup();
    render(<ValidatedTextField {...defaultProps} fieldPath="room.name" />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Invalid@Room!');

    // Wait for debounced validation
    await waitFor(() => {
      expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
    }, { timeout: 400 });
  });

  it('should not validate on change when validateOnChange is false', async () => {
    const user = userEvent.setup();
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        validateOnChange={false}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Invalid@Room!');

    expect(screen.queryByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).not.toBeInTheDocument();
  });

  it('should display custom helper text when no error', () => {
    const customHelperText = 'Custom helper text';
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        helperText={customHelperText}
      />
    );

    expect(screen.getByText(customHelperText)).toBeInTheDocument();
  });

  it('should display error message instead of helper text when there is an error', async () => {
    const customHelperText = 'Custom helper text';
    const user = userEvent.setup();
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        helperText={customHelperText}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Invalid@Room!');
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByText(customHelperText)).not.toBeInTheDocument();
      expect(screen.getByText('Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces')).toBeInTheDocument();
    });
  });

  it('should handle required field validation', async () => {
    const user = userEvent.setup();
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        required
      />
    );

    const input = screen.getByRole('textbox');
    await user.clear(input);
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.getByText('Ce champ est requis')).toBeInTheDocument();
    });
  });

  it('should show required asterisk when required prop is true', () => {
    render(
      <ValidatedTextField
        {...defaultProps}
        fieldPath="room.name"
        required
      />
    );

    // The required prop should be passed through to the underlying TextField
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });
});
