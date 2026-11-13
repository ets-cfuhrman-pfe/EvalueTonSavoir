import React from 'react';
import { HourglassEmpty } from '@mui/icons-material';
import { Button } from '@mui/material';

interface WaitingForNextQuestionProps {
    onViewResults?: () => void;
}

const WaitingForNextQuestion: React.FC<WaitingForNextQuestionProps> = ({ onViewResults }) => {
    return (
        <div className="teacher-mode-waiting-page" data-testid="waiting-for-next-question">
            <div className="waiting-icon-circle">
                <HourglassEmpty className="waiting-hourglass-icon" />
            </div>
            <p className="waiting-message">
                {onViewResults
                    ? 'Toutes les questions ont été répondues !'
                    : 'Réponse soumise ! En attente de la question suivante.'}
            </p>
            {onViewResults && (
                <Button
                    variant="contained"
                    size="large"
                    onClick={onViewResults}
                    className="mt-3"
                >
                    Voir les résultats
                </Button>
            )}
        </div>
    );
};

export default WaitingForNextQuestion;
