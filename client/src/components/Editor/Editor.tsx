// Editor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import type { editor as MonacoEditorNS, IDisposable } from 'monaco-editor';
import { Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { buildGiftDiagnosticMarkers } from 'src/utils/giftDiagnostics';
import { splitGiftSource } from 'src/utils/giftBlockSplitter';

const MONACO_MARKER_OWNER = 'gift-diagnostics';
const DIAGNOSTIC_DEBOUNCE_MS = 250;

export interface EditorCursorRequest {
    offset: number;
    endOffset?: number;
    requestId: number;
}

function resolveQuestionOffsets(
    text: string,
    request: EditorCursorRequest
): { startOffset: number; endOffset: number } {
    const startOffset = Math.max(0, Math.min(request.offset, text.length));
    let endOffset: number;

    if (typeof request.endOffset === 'number') {
        endOffset = request.endOffset;
    } else {
        const matchedRange = splitGiftSource(text).ranges.find(
            (r) => startOffset >= r.start && startOffset <= r.end
        );
        endOffset = matchedRange ? matchedRange.end : startOffset;
    }

    endOffset = Math.max(startOffset, Math.min(endOffset, text.length));
    while (endOffset > startOffset && (text[endOffset - 1] === '\n' || text[endOffset - 1] === '\r')) {
        endOffset -= 1;
    }

    return { startOffset, endOffset };
}

interface EditorProps {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
    onCursorChange?: (offset: number) => void;
    cursorRequest?: EditorCursorRequest | null;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onEditorChange, label, onCursorChange, cursorRequest }) => {
    const [value, setValue] = useState(initialValue);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [editorHeight, setEditorHeight] = useState(200);
    const [highlightedLineRange, setHighlightedLineRange] = useState<{ startLine: number; endLine: number } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const editorInstanceRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
    const resizeSubscriptionRef = useRef<IDisposable | null>(null);
    const cursorSubscriptionRef = useRef<IDisposable | null>(null);
    const contentSubscriptionRef = useRef<IDisposable | null>(null);
    const focusSubscriptionRef = useRef<IDisposable | null>(null);
    const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const redirectDecorationsRef = useRef<MonacoEditorNS.IEditorDecorationsCollection | null>(null);
    const isTestEnvironment = process.env.NODE_ENV === 'test';
    const onCursorChangeRef = useRef(onCursorChange);
    const isProgrammaticFocusRef = useRef(false);
    const pendingCursorRequestRef = useRef<EditorCursorRequest | null>(null);
    const lastAppliedRequestIdRef = useRef<number | null>(null);
    useEffect(() => {
        onCursorChangeRef.current = onCursorChange;
    }, [onCursorChange]);

    const clearRedirectHighlight = useCallback(() => {
        redirectDecorationsRef.current?.clear();
        setHighlightedLineRange(null);
    }, []);

    const highlightRedirectedQuestion = useCallback((startLineNumber: number, endLineNumber: number, requestId: number) => {
        const safeEndLine = Math.max(startLineNumber, endLineNumber);
        setHighlightedLineRange({ startLine: startLineNumber, endLine: safeEndLine });

        const editor = editorInstanceRef.current;
        const model = editor?.getModel();
        if (!editor || !model) return;

        redirectDecorationsRef.current ??= editor.createDecorationsCollection?.() ?? null;
        if (!redirectDecorationsRef.current) return;

        const pulseClass =
            requestId % 2 === 0
                ? 'editor-redirect-line-highlight--pulse-even'
                : 'editor-redirect-line-highlight--pulse-odd';

        redirectDecorationsRef.current.set([
            {
                range: {
                    startLineNumber,
                    startColumn: 1,
                    endLineNumber: safeEndLine,
                    endColumn: model.getLineMaxColumn(safeEndLine),
                },
                options: {
                    isWholeLine: true,
                    shouldFillLineOnLineBreak: true,
                    className: `editor-redirect-line-highlight ${pulseClass}`,
                    linesDecorationsClassName: 'editor-redirect-line-accent',
                    marginClassName: 'editor-redirect-line-margin',
                    lineNumberClassName: 'editor-redirect-line-number',
                },
            },
        ]);
    }, []);

    const cleanupMonacoResources = useCallback(() => {
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

        if (focusSubscriptionRef.current) {
            focusSubscriptionRef.current.dispose();
            focusSubscriptionRef.current = null;
        }

        if (validationTimeoutRef.current) {
            clearTimeout(validationTimeoutRef.current);
            validationTimeoutRef.current = null;
        }

        redirectDecorationsRef.current?.clear();
        redirectDecorationsRef.current = null;
    }, []);

    useEffect(() => {
        setValue(initialValue); // keeps the test-environment textarea in sync

        const editorInstance = editorInstanceRef.current;
        if (!editorInstance) return;
        const model = editorInstance.getModel();
        if (!model || model.getValue() === initialValue) return;

        model.setValue(initialValue);
    }, [initialValue]);

    const handleEditorChange = useCallback((newValue = '') => {
        const text = newValue;
        setValue(text);
        clearRedirectHighlight();
        onEditorChange(text);
    }, [clearRedirectHighlight, onEditorChange]);

    const applyCursorRequest = useCallback((request: EditorCursorRequest) => {
        if (isTestEnvironment) {
            const textarea = textareaRef.current;
            if (!textarea) {
                pendingCursorRequestRef.current = request;
                return;
            }

            const { startOffset, endOffset } = resolveQuestionOffsets(textarea.value, request);
            const startLineNumber = textarea.value.slice(0, startOffset).split('\n').length;
            const endLineNumber = textarea.value.slice(0, endOffset).split('\n').length;
            textarea.focus();
            textarea.setSelectionRange(startOffset, startOffset);
            setHighlightedLineRange({
                startLine: startLineNumber,
                endLine: Math.max(startLineNumber, endLineNumber),
            });
            onCursorChangeRef.current?.(startOffset);
            lastAppliedRequestIdRef.current = request.requestId;
            pendingCursorRequestRef.current = null;
            return;
        }

        const editor = editorInstanceRef.current;
        const model = editor?.getModel();
        if (!editor || !model) {
            pendingCursorRequestRef.current = request;
            return;
        }

        const { startOffset, endOffset } = resolveQuestionOffsets(model.getValue(), request);
        const position = model.getPositionAt(startOffset);
        const endPosition = model.getPositionAt(endOffset);

        isProgrammaticFocusRef.current = true;
        editor.setPosition(position);
        editor.revealLineInCenterIfOutsideViewport?.(position.lineNumber);
        editor.focus();
        highlightRedirectedQuestion(position.lineNumber, endPosition.lineNumber, request.requestId);
        onCursorChangeRef.current?.(startOffset);
        lastAppliedRequestIdRef.current = request.requestId;
        pendingCursorRequestRef.current = null;

        const domNode = editor.getDomNode?.();
        const lineTop = typeof editor.getTopForLineNumber === 'function'
            ? editor.getTopForLineNumber(position.lineNumber)
            : 0;
        if (domNode) {
            const scrollContainer = domNode.closest('.overflow-auto');
            const rect = domNode.getBoundingClientRect();
            if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight) {
                const containerRect = scrollContainer.getBoundingClientRect();
                const offsetInContainer = (rect.top - containerRect.top) + lineTop;
                scrollContainer.scrollBy({
                    top: offsetInContainer - 24,
                    behavior: 'smooth',
                });
            }
            const stickyHeaderOffset = 140;
            const targetWindowY = Math.max(0, window.scrollY + rect.top + lineTop - stickyHeaderOffset);
            requestAnimationFrame(() => {
                window.scrollTo({
                    top: targetWindowY,
                    behavior: 'smooth',
                });
                isProgrammaticFocusRef.current = false;
            });
        } else {
            requestAnimationFrame(() => {
                isProgrammaticFocusRef.current = false;
            });
        }
    }, [highlightRedirectedQuestion, isTestEnvironment]);

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        editorInstanceRef.current = editor;
        cleanupMonacoResources();

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
            if (!isProgrammaticFocusRef.current) {
                clearRedirectHighlight();
            }

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
        focusSubscriptionRef.current = editor.onDidFocusEditorText(() => {
            if (isProgrammaticFocusRef.current) {
                return;
            }
            const viewportX = window.scrollX;
            const viewportY = window.scrollY;
            requestAnimationFrame(() => {
                window.scrollTo(viewportX, viewportY);
            });
        });
        validateModel();

        const model = editor.getModel();
        if (model && onCursorChangeRef.current) {
            const initialOffset = model.getOffsetAt(editor.getPosition() ?? { lineNumber: 1, column: 1 });
            onCursorChangeRef.current(initialOffset);
        }

        cursorSubscriptionRef.current = editor.onDidChangeCursorPosition((event) => {
            if (!isProgrammaticFocusRef.current) {
                clearRedirectHighlight();
            }

            const currentModel = editor.getModel();
            if (!currentModel) return;
            onCursorChangeRef.current?.(currentModel.getOffsetAt(event.position));
        });

        if (pendingCursorRequestRef.current) {
            applyCursorRequest(pendingCursorRequestRef.current);
        }
    }, [applyCursorRequest, cleanupMonacoResources, clearRedirectHighlight]);

    useEffect(() => {
        if (!cursorRequest || cursorRequest.requestId === lastAppliedRequestIdRef.current) {
            return;
        }

        pendingCursorRequestRef.current = cursorRequest;

        if (isCollapsed) {
            setIsCollapsed(false);
            return;
        }

        applyCursorRequest(cursorRequest);
    }, [cursorRequest, isCollapsed, applyCursorRequest]);

    useEffect(() => {
        if (!isCollapsed) return;
        editorInstanceRef.current = null;
        cleanupMonacoResources();
    }, [cleanupMonacoResources, isCollapsed]);

    useEffect(() => {
        return cleanupMonacoResources;
    }, [cleanupMonacoResources]);

    const handleTextareaCursorMove = useCallback(() => {
        clearRedirectHighlight();
        if (!onCursorChange || !textareaRef.current) return;
        onCursorChange(textareaRef.current.selectionStart ?? 0);
    }, [clearRedirectHighlight, onCursorChange]);

    const highlightedLineAttr = highlightedLineRange
        ? highlightedLineRange.startLine === highlightedLineRange.endLine
            ? `${highlightedLineRange.startLine}`
            : `${highlightedLineRange.startLine}-${highlightedLineRange.endLine}`
        : undefined;

    return (
        <div className='mb-3 editor-v2-root'>
            {/* Editor Header with Collapse Toggle */}
            <div
                className='d-flex justify-content-between align-items-center mb-2 editor-v2-sticky-header'
                data-testid='editor-section-header'
            >
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
                    className={`editor-v2-monaco${highlightedLineRange !== null ? ' editor-v2-monaco--line-highlighted' : ''}`}
                    data-highlighted-line={highlightedLineAttr}
                    data-highlighted-start-line={highlightedLineRange?.startLine}
                    data-highlighted-end-line={highlightedLineRange?.endLine}
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
                            defaultValue={initialValue}
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
