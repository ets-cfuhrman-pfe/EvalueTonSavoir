// Editor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EditorProps {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onEditorChange, label }) => {
    const [value, setValue] = useState(initialValue);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        if (editorRef.current) {
            editorRef.current.style.height = 'auto';
            editorRef.current.style.height = `${editorRef.current.scrollHeight + 4}px`;
        }
    }, []);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // Re-calculate height when content changes
    useEffect(() => {
        if (!isCollapsed) {
            adjustHeight();
        }
    }, [value, isCollapsed, adjustHeight]);

    // Handle container resizes 
    useEffect(() => {
        if (isCollapsed || !editorRef.current) return;

        let animationFrameId: number;

        const resizeObserver = new ResizeObserver(() => {
            // Use requestAnimationFrame to avoid ResizeObserver loop limit errors
            animationFrameId = requestAnimationFrame(() => {
                adjustHeight();
            });
        });

        // Observe the immediate parent container to catch layout changes
        const container = editorRef.current.parentElement;
        if (container) {
            resizeObserver.observe(container);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
        };
    }, [isCollapsed, adjustHeight]);

    function handleEditorChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const text = event.target.value;
        setValue(text);
        onEditorChange(text || '');
    }

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
                <textarea
                    rows={5}
                    id='editor-textarea'
                    ref={editorRef}
                    onChange={handleEditorChange}
                    value={value}
                    className='form-control editor-v2-textarea'
                    style={{ overflow: 'hidden', resize: 'none' }}
                />
            )}
        </div>
    );
};

export default Editor;
