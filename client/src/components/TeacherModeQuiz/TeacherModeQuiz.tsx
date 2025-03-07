// TeacherModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionComponent from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Question } from 'gift-pegjs';

interface TeacherModeQuizProps {
    questionInfos: QuestionType;
    submitAnswer: (_answer: string | number | boolean, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const TeacherModeQuiz: React.FC<TeacherModeQuizProps> = ({
    questionInfos,
    submitAnswer,
    disconnectWebSocket
}) => {
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    const [answer, setAnswer] = useState<string | number | boolean>();


    useEffect(() => {
        // Close the feedback dialog when the question changes
        handleFeedbackDialogClose();
        setIsAnswerSubmitted(false);
        setAnswer(JSON.parse(localStorage.getItem(`Answer${questionInfos.question.id}`)||'null'));
        if (typeof answer !== "object" && typeof answer !== "undefined") {
            setIsAnswerSubmitted(true);
            setIsFeedbackDialogOpen(true);
        }

    }, [questionInfos.question , answer]);

    const handleOnSubmitAnswer = (answer: string | number | boolean) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        setAnswer(answer);
        setIsFeedbackDialogOpen(true);
    };

    const handleFeedbackDialogClose = () => {
        setIsFeedbackDialogOpen(false);
        setIsAnswerSubmitted(true);
    };

    return (
        <div className='room'>
                <div className='roomHeader'>

                    <DisconnectButton
                        onReturn={disconnectWebSocket}
                        message={`Êtes-vous sûr de vouloir quitter?`} />

                    <div className='centerTitle'>
                        <div className='title'>Question {questionInfos.question.id}</div>
                    </div>

                    <div className='dumb'></div>

                </div>

                {isAnswerSubmitted ? (
                <div>
                    En attente pour la prochaine question...
                </div>
            ) : (
                <QuestionComponent
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    question={questionInfos.question as Question}
                    answer={answer} 
                />
            )}

            <Dialog
                open={isFeedbackDialogOpen}
                onClose={handleFeedbackDialogClose}
            >
                <DialogTitle>Rétroaction</DialogTitle>
                <DialogContent>
                    <div style={{
                            wordWrap: 'break-word',
                            whiteSpace: 'pre-wrap',
                            maxHeight: '400px',
                            overflowY: 'auto',
                        }}>
                    <div style={{ textAlign: 'left', fontWeight: 'bold', marginTop: '10px'}}
                    >Question : </div>                    
                    </div>
                    
                <QuestionComponent
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    question={questionInfos.question as Question}
                    showAnswer={true}
                    answer={answer} 

                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFeedbackDialogClose} color="primary">
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
                        </div>
    );
};

export default TeacherModeQuiz;
