import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ReturnButtonV2 from 'src/components/ReturnButton/ReturnButtonV2';

describe('ReturnButtonV2', () => {
  describe('Return Button Behavior', () => {
    test('shows UnsavedChangesDialog when there are unsaved changes', async () => {
      const hasUnsavedChanges = () => true;
      const onSaveAndQuit = jest.fn();
      const onDontSaveAndQuit = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveAndQuit={onSaveAndQuit}
            onDontSaveAndQuit={onDontSaveAndQuit}
          />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      await waitFor(() => {
        expect(screen.getByTestId('unsaved-changes-dialog')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });

    test('shows ConfirmDialog when there are no unsaved changes', () => {
      const hasUnsavedChanges = () => false;
      const onSaveAndQuit = jest.fn();
      const onDontSaveAndQuit = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveAndQuit={onSaveAndQuit}
            onDontSaveAndQuit={onDontSaveAndQuit}
          />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.queryByTestId('unsaved-changes-dialog')).not.toBeInTheDocument();
    });

    test('shows ConfirmDialog when hasUnsavedChanges is not provided', async () => {
      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={true} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      });
    });
  });

  describe('UnsavedChangesDialog Actions', () => {
    test('Save button calls onSaveAndQuit callback', () => {
      const hasUnsavedChanges = () => true;
      const onSaveAndQuit = jest.fn();
      const onDontSaveAndQuit = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveAndQuit={onSaveAndQuit}
            onDontSaveAndQuit={onDontSaveAndQuit}
          />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      const saveBtn = screen.getByTestId('unsaved-save-btn');
      fireEvent.click(saveBtn);

      expect(onSaveAndQuit).toHaveBeenCalled();
      expect(onDontSaveAndQuit).not.toHaveBeenCalled();
    });

    test('Don\'t Save button calls onDontSaveAndQuit callback', () => {
      const hasUnsavedChanges = () => true;
      const onSaveAndQuit = jest.fn();
      const onDontSaveAndQuit = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveAndQuit={onSaveAndQuit}
            onDontSaveAndQuit={onDontSaveAndQuit}
          />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      const dontSaveBtn = screen.getByTestId('unsaved-dont-save-btn');
      fireEvent.click(dontSaveBtn);

      expect(onDontSaveAndQuit).toHaveBeenCalled();
      expect(onSaveAndQuit).not.toHaveBeenCalled();
    });

    test('Cancel button closes dialog without calling callbacks', async () => {
      const hasUnsavedChanges = () => true;
      const onSaveAndQuit = jest.fn();
      const onDontSaveAndQuit = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2
            hasUnsavedChanges={hasUnsavedChanges}
            onSaveAndQuit={onSaveAndQuit}
            onDontSaveAndQuit={onDontSaveAndQuit}
          />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      await waitFor(() => {
        const cancelBtn = screen.getByTestId('unsaved-cancel-btn');
        fireEvent.click(cancelBtn);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('unsaved-changes-dialog')).not.toBeInTheDocument();
      });
      expect(onSaveAndQuit).not.toHaveBeenCalled();
      expect(onDontSaveAndQuit).not.toHaveBeenCalled();
    });
  });

  describe('ConfirmDialog Actions', () => {
    test('Confirm button calls onReturn when provided', async () => {
      const onReturn = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={true} onReturn={onReturn} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      await waitFor(() => {
        const confirmBtn = screen.getByTestId('confirm-btn');
        fireEvent.click(confirmBtn);
      });

      expect(onReturn).toHaveBeenCalled();
    });

    test('Confirm button closes dialog and navigates back when onReturn is not provided', async () => {
      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={true} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      const confirmBtn = await screen.findByTestId('confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    test('Cancel button closes dialog without navigation', async () => {
      const onReturn = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={true} onReturn={onReturn} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      await waitFor(() => {
        const cancelBtn = screen.getByTestId('cancel-btn');
        fireEvent.click(cancelBtn);
      });

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
      expect(onReturn).not.toHaveBeenCalled();
    });
  });

  describe('Legacy Behavior', () => {
    test('shows ConfirmDialog when askConfirm is true and hasUnsavedChanges is not provided', () => {
      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={true} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    test('does not show dialog when askConfirm is false and hasUnsavedChanges is not provided', () => {
      const onReturn = jest.fn();

      render(
        <MemoryRouter>
          <ReturnButtonV2 askConfirm={false} onReturn={onReturn} />
        </MemoryRouter>
      );

      const returnButton = screen.getByRole('button', { name: /retour/i });
      fireEvent.click(returnButton);

      expect(onReturn).toHaveBeenCalled();
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    });
  });
});