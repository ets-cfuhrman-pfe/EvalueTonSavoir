// Editor.tsx
import React, { useState } from 'react';
import './editor.css';
import ValidatedTextField from '../ValidatedTextField/ValidatedTextField';

interface EditorProps {
    label: string;
    initialValue: string;
    onEditorChange: (value: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialValue, onEditorChange, label }) => {
    const [value, setValue] = useState(initialValue);

    return (
        <label>
            <h4>{label}</h4>
            <ValidatedTextField
                fieldPath="quiz.content"
                initialValue={value}
                onValueChange={(val) => {
                    setValue(val);
                    onEditorChange(val || '');
                }}
                className="editor"
                multiline
                minRows={5}
                variant="outlined"
                fullWidth
            />
        </label>
    );
};

export default Editor;
