import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from '@jest/globals';
import validationService from '../../services/ValidationService';

// Use the shared constants so the UI mirrors app rules
const VALIDATION = require('../../../../shared/validationConstants').room;

// small helper to enforce max length consistently
function clampToMax(value: string, max: number) {
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Test-only React component that mimics a room name input UI:
 * - shows a counter
 * - shows a warning when approaching max
 * - prevents typing beyond max (locks out)
 */
function TestRoomNameInput() {
  const max = VALIDATION.name.maxLength;
  const warnThreshold = Math.max(1, max - 5);
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToMax(e.target.value, max);
    setValue(v);
  };

  const validation = validationService.validateField('room.name', value);

  return (
    <div>
      <label htmlFor="room-name">Nom de la salle</label>
      <input id="room-name" aria-label="room-name" value={value} onChange={handleChange} />
      <div data-testid="counter">{value.length}/{max}</div>
      {value.length >= max && <output>Max length reached</output>}
      {value.length >= warnThreshold && value.length < max && (
        <output>Approaching max length</output>
      )}
      {validation.errors.length > 0 && <div role="alert">{validation.errors[0]}</div>}
    </div>
  );
}

describe('Room name UI behaviour', () => {
  it('shows counter and allows typing until max, then locks input', () => {
    render(<TestRoomNameInput />);

    const input = screen.getByLabelText('room-name') as HTMLInputElement;
    const counter = screen.getByTestId('counter');

    // type under warning threshold
    fireEvent.change(input, { target: { value: 'A'.repeat(VALIDATION.name.maxLength - 6) } });
  expect(counter.textContent).toBe(`${VALIDATION.name.maxLength - 6}/${VALIDATION.name.maxLength}`);
  expect(screen.queryByText(/Approaching max length/i)).toBeNull();

    // type into warning zone
    fireEvent.change(input, { target: { value: 'A'.repeat(VALIDATION.name.maxLength - 3) } });
  expect(screen.getByText(/Approaching max length/i)).not.toBeNull();

    // type to exactly max
    fireEvent.change(input, { target: { value: 'A'.repeat(VALIDATION.name.maxLength) } });
  expect(counter.textContent).toBe(`${VALIDATION.name.maxLength}/${VALIDATION.name.maxLength}`);
  expect(screen.getByText(/Max length reached/i)).not.toBeNull();

    // attempt to type beyond max - should remain at max
    fireEvent.change(input, { target: { value: 'A'.repeat(VALIDATION.name.maxLength + 5) } });
  expect(counter.textContent).toBe(`${VALIDATION.name.maxLength}/${VALIDATION.name.maxLength}`);
  });

  it('shows validation error when input contains invalid characters', () => {
    render(<TestRoomNameInput />);
    const input = screen.getByLabelText('room-name') as HTMLInputElement;

    // Accented characters are invalid per pattern
    fireEvent.change(input, { target: { value: 'Salle Étudiants' } });
  const alert = screen.getByRole('alert');
  expect(alert.textContent).toContain(VALIDATION.name.errorMessage);
  });
});

/** Room Description component for UI testing */
function TestRoomDescriptionInput() {
  const max = VALIDATION.description.maxLength;
  const warnThreshold = Math.max(1, max - 20);
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
  };

  const validation = validationService.validateField('room.description', value);

  return (
    <div>
      <label htmlFor="room-description">Description</label>
      <textarea id="room-description" aria-label="room-description" value={value} onChange={handleChange} />
      <div data-testid="desc-counter">{value.length}/{max}</div>
      {value.length >= warnThreshold && value.length < max && <output>Approaching max length</output>}
      {validation.errors.length > 0 && <div role="alert">{validation.errors[0]}</div>}
    </div>
  );
}

describe('Room description UI behaviour', () => {
  it('shows counter, warning and validation error for too long description', () => {
    render(<TestRoomDescriptionInput />);

    const textarea = screen.getByLabelText('room-description') as HTMLTextAreaElement;
    const counter = screen.getByTestId('desc-counter');

    // under warning threshold
    fireEvent.change(textarea, { target: { value: 'A'.repeat(VALIDATION.description.maxLength - 30) } });
    expect(counter.textContent).toBe(`${VALIDATION.description.maxLength - 30}/${VALIDATION.description.maxLength}`);
    expect(screen.queryByText(/Approaching max length/i)).toBeNull();

    // enter warning zone
    fireEvent.change(textarea, { target: { value: 'A'.repeat(VALIDATION.description.maxLength - 10) } });
    expect(screen.getByText(/Approaching max length/i)).not.toBeNull();

    // exceed max -> validation error should appear
    fireEvent.change(textarea, { target: { value: 'A'.repeat(VALIDATION.description.maxLength + 1) } });
    const alert = screen.getByRole('alert');
    expect(alert.textContent).toContain(VALIDATION.description.errorMessage);
  });
});

/** Room Password component for UI testing */
function TestRoomPasswordInput({ required = false }: { required?: boolean }) {
  const max = VALIDATION.password.maxLength;
  const [value, setValue] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clampToMax(e.target.value, max);
    setValue(v);
  };

  const validation = validationService.validateField('room.password', value, { required });

  return (
    <div>
      <label htmlFor="room-password">Mot de passe</label>
      <input id="room-password" aria-label="room-password" type="password" value={value} onChange={handleChange} />
      <div data-testid="pass-counter">{value.length}/{max}</div>
      {validation.errors.length > 0 && <div role="alert">{validation.errors[0]}</div>}
    </div>
  );
}

describe('Room password UI behaviour', () => {
  it('accepts valid passwords and enforces max length', () => {
    render(<TestRoomPasswordInput required={false} />);

    const input = screen.getByLabelText('room-password') as HTMLInputElement;
    const counter = screen.getByTestId('pass-counter');

    fireEvent.change(input, { target: { value: '1234' } });
    expect(counter.textContent).toBe(`4/${VALIDATION.password.maxLength}`);
    expect(screen.queryByRole('alert')).toBeNull();

    // attempt to exceed max
    fireEvent.change(input, { target: { value: 'A'.repeat(VALIDATION.password.maxLength + 5) } });
    expect(counter.textContent).toBe(`${VALIDATION.password.maxLength}/${VALIDATION.password.maxLength}`);
  });

  it('rejects too short passwords when provided and shows required error when required and empty', () => {
    // too short
    render(<TestRoomPasswordInput required={false} />);
    const inputShort = screen.getByLabelText('room-password') as HTMLInputElement;
    fireEvent.change(inputShort, { target: { value: '123' } });
    const alertShort = screen.getByRole('alert');
    expect(alertShort.textContent).toContain(VALIDATION.password.errorMessage);

    // required and empty
    render(<TestRoomPasswordInput required={true} />);
    const inputReq = screen.getAllByLabelText('room-password')[1] as HTMLInputElement;
    fireEvent.change(inputReq, { target: { value: '' } });
    const alertReq = screen.getAllByRole('alert')[1];
    expect(alertReq.textContent).toContain('Ce champ est requis');
  });
});
