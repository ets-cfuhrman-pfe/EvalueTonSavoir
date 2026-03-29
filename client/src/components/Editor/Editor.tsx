// Editor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type { IDisposable } from 'monaco-editor';
import { Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { buildGiftDiagnosticMarkers } from 'src/utils/giftDiagnostics';

const MONACO_MARKER_OWNER = 'gift-diagnostics';
const DIAGNOSTIC_DEBOUNCE_MS = 250;

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
    const cursorSubscriptionRef = useRef<IDisposable | null>(null);
    const contentSubscriptionRef = useRef<IDisposable | null>(null);
    const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTestEnvironment = process.env.NODE_ENV === 'test';

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleEditorChange = useCallback((newValue = '') => {
        const text = newValue;
        setValue(text);
        onEditorChange(text);
    }, [onEditorChange]);

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        const updateEditorHeight = () => {
            const contentHeight = editor.getContentHeight();
            setEditorHeight(Math.max(200, contentHeight + 6));
            editor.layout();
        };

        const validateModel = () => {
            const model = editor.getModel();
            if (!model) return;

            const diagnostics = buildGiftDiagnosticMarkers(model.getValue());
            const markers = diagnostics.map((diagnostic) => ({
                ...diagnostic,
                severity: monaco.MarkerSeverity.Error,
            }));

            monaco.editor.setModelMarkers(model, MONACO_MARKER_OWNER, markers);
        };

        const scheduleValidation = () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }

            validationTimeoutRef.current = setTimeout(() => {
                validateModel();
            }, DIAGNOSTIC_DEBOUNCE_MS);
        };

        updateEditorHeight();
        resizeSubscriptionRef.current = editor.onDidContentSizeChange(updateEditorHeight);
        contentSubscriptionRef.current = editor.onDidChangeModelContent(scheduleValidation);
        validateModel();

        if (onCursorChange) {
            const model = editor.getModel();
            if (!model) return;

            const initialOffset = model.getOffsetAt(editor.getPosition() ?? { lineNumber: 1, column: 1 });
            onCursorChange(initialOffset);

            cursorSubscriptionRef.current = editor.onDidChangeCursorPosition((event) => {
                const currentModel = editor.getModel();
                if (!currentModel) return;
                onCursorChange(currentModel.getOffsetAt(event.position));
            });
        }
    }, [onCursorChange]);

    useEffect(() => {
        // Cleanup function to dispose of Monaco editor subscriptions and timeouts
        return () => {
            if (resizeSubscriptionRef.current) {
                resizeSubscriptionRef.current.dispose();
                resizeSubscriptionRef.current = null;
            }

            if (cursorSubscriptionRef.current) {
                cursorSubscriptionRef.current.dispose();
                cursorSubscriptionRef.current = null;
            }

            if (contentSubscriptionRef.current) {
                contentSubscriptionRef.current.dispose();
                contentSubscriptionRef.current = null;
            }

            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
                validationTimeoutRef.current = null;
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
