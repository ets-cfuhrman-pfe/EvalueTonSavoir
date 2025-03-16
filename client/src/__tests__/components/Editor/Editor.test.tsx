import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Editor from '../../../components/Editor/Editor';

describe('Editor Component', () => {
    const mockOnValuesChange = jest.fn();

    const sampleProps = {
        label: 'Sample Label',
        values: ['Question 1', 'Question 2'],
        onValuesChange: mockOnValuesChange
    };

    beforeEach(() => {
        mockOnValuesChange.mockClear();
    });

    test('renders the label correctly', () => {
        render(<Editor {...sampleProps} />);
        const label = screen.getByText('Sample Label');
        expect(label).toBeInTheDocument();
    });

    test('renders the correct number of questions', () => {
        render(<Editor {...sampleProps} />);
        const questions = screen.getAllByRole('textbox');
        expect(questions.length).toBe(2);
    });

    test('calls onValuesChange with updated values when a question is changed', () => {
        render(<Editor {...sampleProps} />);
        const questionInput = screen.getAllByRole('textbox')[0];
        fireEvent.change(questionInput, { target: { value: 'Updated Question 1' } });
        expect(mockOnValuesChange).toHaveBeenCalledWith(['Updated Question 1', 'Question 2']);
    });

    test('calls onValuesChange with updated values when a question is deleted', () => {
        render(<Editor {...sampleProps} />);
        const deleteButton = screen.getAllByLabelText('delete')[0];
        fireEvent.click(deleteButton);
        expect(mockOnValuesChange).toHaveBeenCalledWith(['Question 2']);
    });

    test('renders delete buttons for each question', () => {
        render(<Editor {...sampleProps} />);
        const deleteButtons = screen.getAllByLabelText('delete');
        expect(deleteButtons.length).toBe(2);
    });
});