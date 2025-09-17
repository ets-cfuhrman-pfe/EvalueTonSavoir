import React, { useState } from 'react';
import '../../styles/main.scss';

import { Share } from '@mui/icons-material';
import { QuizType } from '../../Types/QuizType';

interface ShareQuizModalV2Props {
    quiz: QuizType;
}

const ShareQuizModalV2: React.FC<ShareQuizModalV2Props> = ({ quiz }) => {
    const [feedback, setFeedback] = useState({
        open: false,
        title: '',
        isError: false
    });

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
    };

    const closeFeedback = () => {
        setFeedback(prev => ({ ...prev, open: false }));
    };

    return (
        <>
            <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={handleShareByUrl}
                title="Partager quiz"
                aria-label="partager quiz"
            >
                <Share fontSize="small" />
            </button>

            {/* Feedback Modal */}
            {feedback.open && (
                <div className="modal show d-block bg-dark bg-opacity-50">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Partage du quiz</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={closeFeedback}
                                ></button>
                            </div>
                            <div className="modal-body text-center">
                                {feedback.isError ? (
                                    <div className="alert alert-danger">
                                        {feedback.title}
                                    </div>
                                ) : (
                                    <div className="alert alert-success">
                                        <strong>L'URL de partage</strong> pour le quiz <strong>{quiz.title}</strong> a été copiée dans le presse-papiers.
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer justify-content-center">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={closeFeedback}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ShareQuizModalV2;