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
        answer,
        setAnswer,
    } = useQuizContext();
    
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

    // arrive here the first time after waiting for next question
    useEffect(() => {
            console.log(`QuestionDisplay: questions: ${JSON.stringify(questions)}`);
        
        console.log(`TeacherModeQuiz: useEffect: answers: ${JSON.stringify(answers)}`);
        console.log(`TeacherModeQuiz: useEffect: questionInfos.question.id: ${index} answer: ${answer}`);
        const oldAnswer = answers[Number(index) -1 ]?.answer;
        console.log(`TeacherModeQuiz: useEffect: oldAnswer: ${oldAnswer}`);
        setAnswer(oldAnswer);
        setShowAnswer(false);
        setIsQuestionSent(false);
    }, [questions[Number(index)].question, answers]);

    // handle showing the feedback dialog
    useEffect(() => {
        console.log(`TeacherModeQuiz: useEffect: answer: ${answer}`);
        setIsAnswerSubmitted(answer !== undefined);
        setIsQuestionSent(answer !== undefined);
    }, [answer]);

    useEffect(() => {
        console.log(`TeacherModeQuiz: useEffect: isAnswerSubmitted: ${isAnswerSubmitted}`);
        setIsQuestionSent(isAnswerSubmitted);
        setShowAnswer(isAnswerSubmitted);
    }, [isAnswerSubmitted]);

    const handleFeedbackDialogClose = () => {
        setIsQuestionSent(false);
        setIsAnswerSubmitted(true);
    };

    return (
        <div className='room'>
            <div className='roomHeader'>

                <DisconnectButton
                    onReturn={disconnectWebSocket}
                    message={`Êtes-vous sûr de vouloir quitter?`} />

                <div className='centerTitle'>
                    <div className='title'>Question {index}</div>
                </div>

                <div className='dumb'></div>

            </div>

            {isAnswerSubmitted ? (
                <div>
                    En attente pour la prochaine question...
                </div>
            ) : (
                <QuestionDisplay/>
            )}

            <Dialog
                open={isQuestionSent}
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

                    <QuestionDisplay
                        //showAnswer={true}
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
