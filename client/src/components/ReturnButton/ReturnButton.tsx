import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { ChevronLeft } from '@mui/icons-material';
import ApiService from '../../services/ApiService'; // Assuming this is where save logic lives

interface Props {
    onReturn?: () => void;
    quizTitle?: string; // Quiz title to save
    quizContent?: string[]; // Quiz content to save
    quizFolder?: string; // Folder ID to save
    quizId?: string; // Quiz ID for updates (optional)
    isNewQuiz?: boolean; // Flag to determine create or update
}

const ReturnButton: React.FC<Props> = ({
    onReturn,
    quizTitle = '',
    quizContent = [],
    quizFolder = '',
    quizId,
    isNewQuiz = false,
}) => {
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false); // Optional: to show saving state

    const handleOnReturnButtonClick = async () => {
        setIsSaving(true);
        try {
            // Automatically save the quiz
            if (isNewQuiz && quizTitle && quizFolder) {
                await ApiService.createQuiz(quizTitle, quizContent, quizFolder);
            } else if (quizId && quizTitle) {
                await ApiService.updateQuiz(quizId, quizTitle, quizContent);
            }
            // If no title/folder, proceed without saving (optional behavior)
            handleOnReturn();
        } catch (error) {
            console.error('Error saving quiz on return:', error);
            // Still navigate even if save fails, to avoid trapping the user
            handleOnReturn();
        } finally {
            setIsSaving(false);
        }
    };

    const handleOnReturn = () => {
        if (onReturn) {
            onReturn();
        } else {
            navigate('/teacher/dashboard'); // Navigate to dashboard instead of -1
        }
    };

    return (
        <div className="returnButton">
            <Button
                variant="text"
                startIcon={<ChevronLeft />}
                onClick={handleOnReturnButtonClick}
                color="primary"
                sx={{ marginLeft: '-0.5rem', fontSize: 16 }}
                disabled={isSaving} // Disable button while saving
            >
                {isSaving ? 'Enregistrement...' : 'Retour'}
            </Button>
        </div>
    );
};

export default ReturnButton;
