// EditorV2.tsx
import React, { useState, useRef } from 'react';
import { TextareaAutosize, Button } from '@mui/material';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface EditorV2Props {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
}

const EditorV2: React.FC<EditorV2Props> = ({ initialValue, onEditorChange, label }) => {
    const [value, setValue] = useState(initialValue);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement | null>(null);

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
                <TextareaAutosize
                    id='editor-textarea'
                    ref={editorRef}
                    onChange={handleEditorChange}
                    value={value}
                    className='form-control editor-v2-textarea'
                    minRows={5}
                />
            )}
        </div>
    );
};

export default EditorV2;
