import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Editor from '../../../components/Editor/newEditor';

describe('Editor Component', () => {
    const mockOnValuesChange = jest.fn();
    const mockOnFocusQuestion = jest.fn();

    const sampleProps = {
        label: 'Sample Label',
        values: ['Question 1', 'Question 2'],
        onValuesChange: mockOnValuesChange,
        onFocusQuestion: mockOnFocusQuestion,
    };

    beforeEach(() => {
        mockOnValuesChange.mockClear();
        mockOnFocusQuestion.mockClear();
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

    test('calls onValuesChange with updated values when an empty question is deleted', () => {
        const sampleProps = {
            label: 'Test Editor',
            values: [''], 
            onValuesChange: mockOnValuesChange,
        };
        render(<Editor {...sampleProps} />);
        const deleteButton = screen.getAllByLabelText('delete')[0]; 
        fireEvent.click(deleteButton);
        expect(mockOnValuesChange).toHaveBeenCalledWith([]);
    });

    test('renders delete buttons for each question', () => {
        render(<Editor {...sampleProps} />);
        const deleteButtons = screen.getAllByLabelText('delete');
        expect(deleteButtons.length).toBe(2);
    });

    test('calls onFocusQuestion with correct index when focus button is clicked', () => {
        render(<Editor {...sampleProps} />);
        const focusButton = screen.getAllByLabelText('focus question')[1];
        fireEvent.click(focusButton);
        expect(mockOnFocusQuestion).toHaveBeenCalledWith(1);
    });

    test('renders focus buttons for each question', () => {
        render(<Editor {...sampleProps} />);
        const focusButtons = screen.getAllByLabelText('focus question');
        expect(focusButtons.length).toBe(2);
    });

    test('does not throw error when onFocusQuestion is not provided', () => {
        const { onFocusQuestion, ...propsWithoutFocus } = sampleProps;
        render(<Editor {...propsWithoutFocus} />);
        const focusButton = screen.getAllByLabelText('focus question')[0];
        expect(() => fireEvent.click(focusButton)).not.toThrow();
    });
});