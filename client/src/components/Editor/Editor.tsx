import React from 'react';
import { TextField, Typography, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

interface EditorProps {
    label: string;
    values: string[];
    onValuesChange: (values: string[]) => void;
    onFocusQuestion?: (index: number) => void;
}

const Editor: React.FC<EditorProps> = ({ label, values, onValuesChange, onFocusQuestion }) => {
    const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValues = [...values];
        newValues[index] = event.target.value;
        onValuesChange(newValues);
    };

    const handleDeleteQuestion = (index: number) => () => {
        const newValues = values.filter((_, i) => i !== index); // Remove the question at the specified index
        onValuesChange(newValues);
    };

    const handleFocusQuestion = (index: number) => () => {
        if (onFocusQuestion) {
            onFocusQuestion(index); // Call the focus function if provided
        }
    }


   return (
        <div>
            <Typography variant="h6" fontWeight="bold" style={{ marginBottom: '24px' }}>
                {label}
            </Typography>

            {values.map((value, index) => (
                <Box key={index} style={{ marginBottom: '24px' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="subtitle1" fontWeight="bold" style={{ marginBottom: '8px' }}>
                            Question {index + 1}
                        </Typography>
                        <Box>
                            {/* Focus (Eye) Button */}
                            <IconButton
                                onClick={handleFocusQuestion(index)}
                                aria-label="focus question"
                                sx={{
                                    color: 'gray',
                                    '&:hover': { color: 'blue' },
                                    marginRight: '8px', // Space between eye and delete
                                }}
                            >
                                <VisibilityIcon />
                            </IconButton>
                            {/* Delete Button */}
                            <IconButton
                                onClick={handleDeleteQuestion(index)}
                                aria-label="delete"
                                sx={{
                                    color: 'light-gray',
                                    '&:hover': { color: 'red' },
                                }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <TextField
                        value={value}
                        onChange={handleChange(index)}
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={Infinity}
                        variant="outlined"
                        style={{ overflow: 'auto' }}
                    />
                </Box>
            ))}
        </div>
    );
};

export default Editor;