// Editor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type { IDisposable } from 'monaco-editor';
import { Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EditorProps {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
    onCursorChange?: (offset: number) => void;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onEditorChange, label, onCursorChange }) => {
    const [value, setValue] = useState(initialValue);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [editorHeight, setEditorHeight] = useState(200);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const resizeSubscriptionRef = useRef<IDisposable | null>(null);
    const isTestEnvironment = process.env.NODE_ENV === 'test';

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleEditorChange = useCallback((newValue = '') => {
        const text = newValue;
        setValue(text);
        onEditorChange(text);
    }, [onEditorChange]);

    const handleEditorDidMount: OnMount = useCallback((editor) => {
        const updateEditorHeight = () => {
            const contentHeight = editor.getContentHeight();
            setEditorHeight(Math.max(200, contentHeight + 6));
            editor.layout();
        };

        updateEditorHeight();
        resizeSubscriptionRef.current = editor.onDidContentSizeChange(updateEditorHeight);

        if (!onCursorChange) return;

        const model = editor.getModel();
        if (!model) return;

        const initialOffset = model.getOffsetAt(editor.getPosition() ?? { lineNumber: 1, column: 1 });
        onCursorChange(initialOffset);

        editor.onDidChangeCursorPosition((event) => {
            const currentModel = editor.getModel();
            if (!currentModel) return;
            onCursorChange(currentModel.getOffsetAt(event.position));
        });
    }, [onCursorChange]);

    useEffect(() => {
        return () => {
            if (resizeSubscriptionRef.current) {
                resizeSubscriptionRef.current.dispose();
                resizeSubscriptionRef.current = null;
            }
        };
    }, []);

    const handleTextareaCursorMove = useCallback(() => {
        if (!onCursorChange || !textareaRef.current) return;
        onCursorChange(textareaRef.current.selectionStart ?? 0);
    }, [onCursorChange]);

    return (
        <div className='mb-3'>
            {/* Editor Header with Collapse Toggle */}
            <div className='d-flex justify-content-between align-items-center mb-2'>
                <h4 className='mb-0'>{label}</h4>
                <Button
                    variant='text'
                    size='large'
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    startIcon={isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                    sx={{ fontSize: '1.1rem', padding: '8px 16px' }}
                >
                    {isCollapsed ? 'Déplier' : 'Replier'}
                </Button>
            </div>

            {/* Collapsible Editor Content */}
            {!isCollapsed && (
                <div
                    id='editor-textarea'
                    className='editor-v2-monaco'
                >
                    {isTestEnvironment ? (
                        <textarea
                            rows={5}
                            ref={textareaRef}
                            onChange={(event) => handleEditorChange(event.target.value)}
                            onClick={handleTextareaCursorMove}
                            onKeyUp={handleTextareaCursorMove}
                            value={value}
                            className='form-control'
                        />
                    ) : (
                        <MonacoEditor
                            language='plaintext'
                            value={value}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            height={`${editorHeight}px`}
                            options={{
                                lineNumbers: 'on',
                                glyphMargin: true,
                                folding: false,
                                showFoldingControls: 'never',
                                minimap: { enabled: false },
                                unicodeHighlight: {
                                    ambiguousCharacters: false,
                                    invisibleCharacters: false,
                                    nonBasicASCII: false,
                                },
                                scrollBeyondLastLine: false,
                                scrollbar: {
                                    vertical: 'hidden',
                                    horizontal: 'auto',
                                    alwaysConsumeMouseWheel: false,
                                },
                                wordWrap: 'on',
                                automaticLayout: true,
                                tabSize: 2,
                                renderLineHighlight: 'all',
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default Editor;
