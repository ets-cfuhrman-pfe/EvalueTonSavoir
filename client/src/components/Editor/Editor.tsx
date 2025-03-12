import React from 'react';
import { TextField, Typography, IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete'; // Import delete icon

interface EditorProps {
    label: string;
    values: string[];
    onValuesChange: (values: string[]) => void;
}

const Editor: React.FC<EditorProps> = ({ label, values, onValuesChange }) => {
    const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValues = [...values];
        newValues[index] = event.target.value;
        onValuesChange(newValues);
    };

    const handleDeleteQuestion = (index: number) => () => {
        const newValues = values.filter((_, i) => i !== index); // Remove the question at the specified index
        onValuesChange(newValues);
    };

    return (
        <div>
            {/* Label with increased margin */}
            <Typography variant="h6" fontWeight="bold" style={{ marginBottom: '24px' }}>
                {label}
            </Typography>

            {/* Map through each question */}
            {values.map((value, index) => (
                <Box key={index} style={{ marginBottom: '24px' }}>
                    {/* Bold "Question #" title */}
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight="bold" style={{ marginBottom: '8px' }}>
                        Question {index + 1}
                    </Typography>

                    {/* Delete button */}
                    <IconButton
                        onClick={handleDeleteQuestion(index)}
                        aria-label="delete"
                        sx={{ color: 'light-gray',
                            '&:hover': {
                                color: 'red'
                            },
                         }}
                    >
                        <DeleteIcon />
                    </IconButton>
                    </Box>
                    {/* TextField for the question */}
                    <TextField
                        value={value}
                        onChange={handleChange(index)}
                        fullWidth
                        multiline
                        minRows={4}
                        maxRows={Infinity}
                        variant="outlined"
                        style={{ overflow: 'auto'}}
                    />


                </Box>
            ))}
        </div>
    );
};

export default Editor;