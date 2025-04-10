import React, { useState } from 'react';
import { TextField, Typography, IconButton, Box, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface EditorProps {
    label: string;
    values: string[];
    onValuesChange: (values: string[]) => void;
    onFocusQuestion?: (index: number) => void;
}

const Editor: React.FC<EditorProps> = ({ label, values, onValuesChange, onFocusQuestion }) => {
    const [collapsed, setCollapsed] = useState<boolean[]>(Array(values.length).fill(false));
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValues = [...values];
        newValues[index] = event.target.value;
        onValuesChange(newValues);
    };

    const handleDeleteQuestion = (index: number) => () => {
        if (values[index].trim() === '') {
            const newValues = values.filter((_, i) => i !== index);
            onValuesChange(newValues);
            setCollapsed((prev) => prev.filter((_, i) => i !== index));
        } else {
            setDeleteIndex(index);
            setDialogOpen(true);
        }
    };

    const handleConfirmDelete = () => {
        if (deleteIndex !== null) {
            const newValues = values.filter((_, i) => i !== deleteIndex);
            onValuesChange(newValues);
            setCollapsed((prev) => prev.filter((_, i) => i !== deleteIndex));
        }
        setDialogOpen(false);
        setDeleteIndex(null);
    };

    const handleCancelDelete = () => {
        setDialogOpen(false);
        setDeleteIndex(null);
    };

    const handleFocusQuestion = (index: number) => () => {
        if (onFocusQuestion) {
            onFocusQuestion(index);
        }
    };

    const handleToggleCollapse = (index: number) => () => {
        setCollapsed((prev) => {
            const newCollapsed = [...prev];
            newCollapsed[index] = !newCollapsed[index];
            return newCollapsed;
        });
    };

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const newValues = [...values];
        const [reorderedItem] = newValues.splice(result.source.index, 1);
        newValues.splice(result.destination.index, 0, reorderedItem);
        onValuesChange(newValues);

        const newCollapsed = [...collapsed];
        const [reorderedCollapsed] = newCollapsed.splice(result.source.index, 1);
        newCollapsed.splice(result.destination.index, 0, reorderedCollapsed);
        setCollapsed(newCollapsed);
    };

    if (collapsed.length !== values.length) {
        setCollapsed((prev) => {
            const newCollapsed = [...prev];
            while (newCollapsed.length < values.length) newCollapsed.push(false);
            while (newCollapsed.length > values.length) newCollapsed.pop();
            return newCollapsed;
        });
    }

    return (
        <div>
            <Typography variant="h6" fontWeight="bold" style={{ marginBottom: '24px' }}>
                {label}
            </Typography>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {values.map((value, index) => (
                                <Draggable key={index} draggableId={`question-${index}`} index={index}>
                                    {(provided) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            sx={{
                                                marginBottom: '8px',
                                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                                                border: '1px solid rgba(0, 0, 0, 0.1)',
                                                padding: '16px',
                                                borderRadius: '4px',
                                                ...provided.draggableProps.style,
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Typography variant="subtitle1" fontWeight="bold" style={{ marginBottom: '8px' }}>
                                                    Question {index + 1}
                                                </Typography>
                                                <Box>
                                                    <IconButton
                                                        onClick={handleToggleCollapse(index)}
                                                        aria-label="toggle collapse"
                                                        sx={{
                                                            color: 'gray',
                                                            '&:hover': { color: 'blue' },
                                                            mr: 1,
                                                        }}
                                                    >
                                                        {collapsed[index] ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                                                    </IconButton>
                                                    <IconButton
                                                        onClick={handleFocusQuestion(index)}
                                                        aria-label="focus question"
                                                        sx={{
                                                            color: 'gray',
                                                            '&:hover': { color: 'blue' },
                                                            mr: 1,
                                                        }}
                                                    >
                                                        <VisibilityIcon />
                                                    </IconButton>
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
                                            <Collapse in={!collapsed[index]}>
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
                                            </Collapse>
                                        </Box>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Confirmation Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCancelDelete}
                aria-labelledby="delete-confirmation-title"
                aria-describedby="delete-confirmation-description"
            >
                <DialogTitle id="delete-confirmation-title" sx={{ textAlign: 'center'}}>Suppression</DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-confirmation-description">
                        Confirmez vous la suppression de Question {deleteIndex !== null ? deleteIndex + 1 : ''} ?
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
                    <Button onClick={handleCancelDelete} color="primary" sx={{ mx: 1 }}>
                        Annuler 
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" sx={{ mx: 1 }} autoFocus>
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Editor;