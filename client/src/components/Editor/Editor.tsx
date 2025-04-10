import React, { useRef } from 'react';
import './editor.css';
import { TextareaAutosize } from '@mui/material';

interface EditorProps {
    label: string;
    values: string[];
    onEditorChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ label, values, onEditorChange }) => {
    const editorRef = useRef<HTMLTextAreaElement | null>(null);

    function handleEditorChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
        const text = event.target.value;
        onEditorChange(text || '');
    }

    return (
        <label>
            <h4>{label}</h4>
            <TextareaAutosize
                id="editor-textarea"
                ref={editorRef}
                onChange={handleEditorChange}
                value={values}
                className="editor"
                minRows={5}
            />
        </label>
    );
};

export default Editor;