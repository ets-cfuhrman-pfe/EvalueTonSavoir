import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Tooltip, IconButton } from '@mui/material';
import { Share } from '@mui/icons-material';
import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

interface ShareQuizModalProps {
    quiz: QuizType;
}

const ShareQuizModal: React.FC<ShareQuizModalProps> = ({ quiz }) => {
    const [open, setOpen] = useState(false);

    const handleOpenModal = () => setOpen(true);

    const handleCloseModal = () => setOpen(false);

    const handleShareByEmail = async () => {
        const email = prompt(`Veuillez saisir l'email de la personne avec qui vous souhaitez partager ce quiz`, "");

        if (email) {
            try {
                const result = await ApiService.ShareQuiz(quiz._id, email);

                if (!result) {
                    window.alert(`Une erreur est survenue.\n Veuillez réessayer plus tard`);
                    return;
                }

                window.alert(`Quiz partagé avec succès!`);
            } catch (error) {
                console.error('Erreur lors du partage du quiz:', error);
            }
        }

        handleCloseModal();
    };

    const handleShareByUrl = () => {
        const quizUrl = `${window.location.origin}/teacher/share/${quiz._id}`;
        navigator.clipboard.writeText(quizUrl)
            .then(() => {
                window.alert('URL copied to clipboard!');
            })
            .catch(() => {
                window.alert('Failed to copy URL to clipboard.');
            });

        handleCloseModal();
    };

    return (
        <>
            <Tooltip title="Partager quiz" placement="top">
                <IconButton color="primary" onClick={handleOpenModal} aria-label="partager quiz">
                    <Share />
                </IconButton>
            </Tooltip>

            <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="xs">
                <DialogTitle sx={{ textAlign: "center" }}>Choisissez une méthode de partage</DialogTitle>
                <DialogActions sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <Button onClick={handleShareByEmail}>Partager par email</Button>
                    <Button onClick={handleShareByUrl}>Partager par URL</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ShareQuizModal;