import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Tooltip, IconButton, Typography, Box } from '@mui/material';
import { Share } from '@mui/icons-material';
import { QuizType } from '../../Types/QuizType';

interface ShareQuizModalProps {
    quiz: QuizType;
}

const ShareQuizModal: React.FC<ShareQuizModalProps> = ({ quiz }) => {
    const [_open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState({
        open: false,
        title: '',
        isError: false
    });

    const handleCloseModal = () => setOpen(false);

    const handleShareByUrl = () => {
        const quizUrl = `${window.location.origin}/teacher/share/${quiz._id}`;
        navigator.clipboard.writeText(quizUrl)
            .then(() => {
                setFeedback({
                    open: true,
                    title: 'L\'URL de partage pour le quiz',
                    isError: false
                });
            })
            .catch(() => {
                setFeedback({
                    open: true,
                    title: 'Une erreur est survenue lors de la copie de l\'URL.',
                    isError: true
                });
            });

        handleCloseModal();
    };

    const closeFeedback = () => {
        setFeedback(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <Tooltip title="Partager" placement="top">
                <IconButton color="primary" onClick={handleShareByUrl} aria-label="partager quiz">
                    <Share />
                </IconButton>
            </Tooltip>

            {/* Feedback Dialog */}
            <Dialog 
                open={feedback.open} 
                onClose={closeFeedback} 
                fullWidth 
                maxWidth="xs"
            >
                <DialogTitle sx={{ textAlign: "center" }}>
                    <Box>
                        {feedback.isError ? (
                            <Typography color="error.main">
                                {feedback.title}
                            </Typography>
                        ) : (
                            <>
                                <Typography component="span">
                                    L'URL de partage pour le quiz{' '}
                                </Typography>
                                <Typography component="span" fontWeight="bold">
                                    {quiz.title}
                                </Typography>
                                <Typography component="span">
                                    {' '}a été copiée.
                                </Typography>
                            </>
                        )}
                    </Box>
                </DialogTitle>
                <DialogActions sx={{ display: "flex", justifyContent: "center" }}>
                    <Button 
                        onClick={closeFeedback} 
                        variant="contained"
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ShareQuizModal;