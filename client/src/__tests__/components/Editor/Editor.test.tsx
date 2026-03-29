// Editor.test.tsx
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import Editor from 'src/components/Editor/Editor';

describe('Editor Component', () => {
    const mockOnEditorChange = jest.fn();

    const sampleProps = {
        label: 'Sample Label',
        initialValue: 'Sample Initial Value',
        onEditorChange: mockOnEditorChange
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly with initial value', () => {
        render(<Editor {...sampleProps} />);
        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(editorTextarea).toBeInTheDocument();
        expect(editorTextarea.value).toBe('Sample Initial Value');
    });

    it('calls onEditorChange callback when editor value changes', () => {
        render(<Editor {...sampleProps} />);
        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.change(editorTextarea, { target: { value: 'Updated Value' } });
        expect(mockOnEditorChange).toHaveBeenCalledWith('Updated Value');
    });

    it('updates editor value when initialValue prop changes', () => {
        const { rerender } = render(<Editor {...sampleProps} />);
        rerender(
            <Editor
                label='Updated Label'
                initialValue='Updated Initial Value'
                onEditorChange={mockOnEditorChange}
            />
        );

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(editorTextarea.value).toBe('Updated Initial Value');
    });

    test('should call change text with the correct value on textarea change', () => {
        render(
            <Editor
                label='Updated Label'
                initialValue='Updated Initial Value'
                onEditorChange={mockOnEditorChange}
            />
        );

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.change(editorTextarea, { target: { value: 'New value' } });

        expect(editorTextarea.value).toBe('New value');
    });

    test('should call onEditorChange with an empty string if textarea value is falsy', () => {
        render(
            <Editor
                label='Updated Label'
                initialValue='Updated Initial Value'
                onEditorChange={mockOnEditorChange}
            />
        );

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.change(editorTextarea, { target: { value: '' } });

        expect(editorTextarea.value).toBe('');
        expect(mockOnEditorChange).toHaveBeenCalledWith('');
    });


});
