// TeacherModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplay from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';


const TeacherModeQuiz: React.FC = () => {
    const {
        questions,
        answers,
        setShowAnswer,
        disconnectWebSocket,
        index,
        isQuestionSent,
        setIsQuestionSent,
    } = useQuizContext();
    
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    console.log("TeacherModeQuiz",answers[Number(index)].answer);
    useEffect(() => {
        if (answers[Number(index)].answer !== undefined) {
            setIsQuestionSent(true);
            setIsDialogOpen(true);
            setShowAnswer(true);
        } else {
            setShowAnswer(false);
            setIsQuestionSent(false);
            setIsDialogOpen(false);
        }

    }, [questions[Number(index)].question, answers]);


    const handleFeedbackDialogClose = () => {
        setIsDialogOpen(false);
    };

    return (
        <div className='room'>
            <div className='roomHeader'>

                <DisconnectButton
                    onReturn={disconnectWebSocket}
                    message={`Êtes-vous sûr de vouloir quitter?`} />

                <div className='centerTitle'>
                    <div className='title'>Question {Number((index ?? 0) + 1)}</div>
                </div>

                <div className='dumb'></div>

            </div>

            {isQuestionSent ? (
                <div>
                    En attente pour la prochaine question...
                </div>
            ) : (
                <QuestionDisplay/>
            )}

            <Dialog
                open={isDialogOpen}
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
                        <div style={{ textAlign: 'left', fontWeight: 'bold', marginTop: '10px' }}
                        >Question : </div>
                    </div>

                    <QuestionDisplay/>
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
