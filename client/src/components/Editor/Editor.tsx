// Editor.tsx
import React, { useState, useRef } from 'react';
import './editor.css';
import { TextareaAutosize } from '@mui/material';

interface EditorProps {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onEditorChange, label }) => {
    const [value, setValue] = useState(initialValue);
    const editorRef = useRef<HTMLTextAreaElement | null>(null);

    function handleEditorChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const text = event.target.value;
        setValue(text);
        onEditorChange(text || '');
    }

    return (
        <label>
            <h4>{label}</h4>
            <TextareaAutosize
                id="editor-textarea"
                ref={editorRef}
                onChange={handleEditorChange}
                value={value}
                className="editor"
                minRows={5}
            />
        </label>
    );
};

export default Editor;