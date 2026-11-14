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

    test('should move cursor to requested offset and call onCursorChange when cursorRequest is provided', () => {
        const mockOnCursorChange = jest.fn();
        const { rerender } = render(
            <Editor
                label='Sample Label'
                initialValue='First question\n\nSecond question'
                onEditorChange={mockOnEditorChange}
                onCursorChange={mockOnCursorChange}
                cursorRequest={null}
            />
        );

        rerender(
            <Editor
                label='Sample Label'
                initialValue='First question\n\nSecond question'
                onEditorChange={mockOnEditorChange}
                onCursorChange={mockOnCursorChange}
                cursorRequest={{ offset: 7, requestId: 1 }}
            />
        );

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(editorTextarea).toHaveFocus();
        expect(editorTextarea.selectionStart).toBe(7);
        expect(editorTextarea.selectionEnd).toBe(7);
        expect(mockOnCursorChange).toHaveBeenCalledWith(7);
    });

    test('should expand collapsed editor and move cursor when cursorRequest is provided', () => {
        const mockOnCursorChange = jest.fn();
        const { rerender } = render(
            <Editor
                label='Sample Label'
                initialValue='First question\n\nSecond question'
                onEditorChange={mockOnEditorChange}
                onCursorChange={mockOnCursorChange}
                cursorRequest={null}
            />
        );

        const collapseButton = screen.getByRole('button', { name: /replier/i });
        fireEvent.click(collapseButton);
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

        rerender(
            <Editor
                label='Sample Label'
                initialValue='First question\n\nSecond question'
                onEditorChange={mockOnEditorChange}
                onCursorChange={mockOnCursorChange}
                cursorRequest={{ offset: 16, requestId: 1 }}
            />
        );

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        expect(editorTextarea).toBeInTheDocument();
        expect(editorTextarea).toHaveFocus();
        expect(editorTextarea.selectionStart).toBe(16);
        expect(editorTextarea.selectionEnd).toBe(16);
        expect(mockOnCursorChange).toHaveBeenCalledWith(16);
    });

    test('should highlight landed line on cursorRequest and clear highlight on cursor move or edit', () => {
        const { container, rerender } = render(
            <Editor
                label='Sample Label'
                initialValue={'First question\n\nSecond question'}
                onEditorChange={mockOnEditorChange}
                cursorRequest={null}
            />
        );

        const editorContainer = container.querySelector('#editor-textarea');
        expect(editorContainer).toBeInTheDocument();
        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');

        rerender(
            <Editor
                label='Sample Label'
                initialValue={'First question\n\nSecond question'}
                onEditorChange={mockOnEditorChange}
                cursorRequest={{ offset: 16, requestId: 1 }}
            />
        );

        expect(editorContainer).toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).toHaveAttribute('data-highlighted-line', '3');

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.click(editorTextarea);

        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');

        rerender(
            <Editor
                label='Sample Label'
                initialValue={'First question\n\nSecond question'}
                onEditorChange={mockOnEditorChange}
                cursorRequest={{ offset: 0, requestId: 2 }}
            />
        );

        expect(editorContainer).toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).toHaveAttribute('data-highlighted-line', '1');

        fireEvent.keyUp(editorTextarea);
        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');

        rerender(
            <Editor
                label='Sample Label'
                initialValue={'First question\n\nSecond question'}
                onEditorChange={mockOnEditorChange}
                cursorRequest={{ offset: 16, requestId: 3 }}
            />
        );

        expect(editorContainer).toHaveAttribute('data-highlighted-line', '3');
        fireEvent.change(editorTextarea, { target: { value: 'Edited question' } });
        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');
    });

    test('should highlight multi-line question block range and clear on cursor move or text change', () => {
        const multiLineGift = 'First question\n\nSecond question start\nSecond question middle\nSecond question end\n\nThird question';
        const secondStart = multiLineGift.indexOf('Second question start');
        const secondEndWithNewline = multiLineGift.indexOf('\n\nThird question') + 1;

        const { container, rerender } = render(
            <Editor
                label='Sample Label'
                initialValue={multiLineGift}
                onEditorChange={mockOnEditorChange}
                cursorRequest={null}
            />
        );

        const editorContainer = container.querySelector('#editor-textarea');
        expect(editorContainer).toBeInTheDocument();

        rerender(
            <Editor
                label='Sample Label'
                initialValue={multiLineGift}
                onEditorChange={mockOnEditorChange}
                cursorRequest={{ offset: secondStart, endOffset: secondEndWithNewline, requestId: 1 }}
            />
        );

        expect(editorContainer).toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).toHaveAttribute('data-highlighted-line', '3-5');
        expect(editorContainer).toHaveAttribute('data-highlighted-start-line', '3');
        expect(editorContainer).toHaveAttribute('data-highlighted-end-line', '5');

        const editorTextarea = screen.getByRole('textbox') as HTMLTextAreaElement;
        fireEvent.click(editorTextarea);
        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-start-line');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-end-line');

        rerender(
            <Editor
                label='Sample Label'
                initialValue={multiLineGift}
                onEditorChange={mockOnEditorChange}
                cursorRequest={{ offset: secondStart, requestId: 2 }}
            />
        );

        expect(editorContainer).toHaveAttribute('data-highlighted-line', '3-5');
        expect(editorContainer).toHaveAttribute('data-highlighted-start-line', '3');
        expect(editorContainer).toHaveAttribute('data-highlighted-end-line', '5');

        fireEvent.change(editorTextarea, { target: { value: 'Changed text' } });
        expect(editorContainer).not.toHaveClass('editor-v2-monaco--line-highlighted');
        expect(editorContainer).not.toHaveAttribute('data-highlighted-line');
    });


});
