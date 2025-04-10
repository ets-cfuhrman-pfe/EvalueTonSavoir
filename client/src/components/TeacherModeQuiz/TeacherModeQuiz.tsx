// TeacherModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionComponent from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
// import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface TeacherModeQuizProps {
    questionInfos: QuestionType;
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const TeacherModeQuiz: React.FC<TeacherModeQuizProps> = ({
    questionInfos,
    answers,
    submitAnswer,
    disconnectWebSocket
}) => {
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
    const [answer, setAnswer] = useState<AnswerType>();


    // arrive here the first time after waiting for next question
    useEffect(() => {
        console.log(`TeacherModeQuiz: useEffect: answers: ${JSON.stringify(answers)}`);
        console.log(`TeacherModeQuiz: useEffect: questionInfos.question.id: ${questionInfos.question.id} answer: ${answer}`);
        const oldAnswer = answers[Number(questionInfos.question.id) -1 ]?.answer;
        console.log(`TeacherModeQuiz: useEffect: oldAnswer: ${oldAnswer}`);
        setAnswer(oldAnswer);
        setIsFeedbackDialogOpen(false);
    }, [questionInfos.question, answers]);

    // handle showing the feedback dialog
    useEffect(() => {
        console.log(`TeacherModeQuiz: useEffect: answer: ${answer}`);
        setIsAnswerSubmitted(answer !== undefined);
        setIsFeedbackDialogOpen(answer !== undefined);
    }, [answer]);

    useEffect(() => {
        console.log(`TeacherModeQuiz: useEffect: isAnswerSubmitted: ${isAnswerSubmitted}`);
        setIsFeedbackDialogOpen(isAnswerSubmitted);
    }, [isAnswerSubmitted]);

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        // setAnswer(answer);
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
                        <div style={{ textAlign: 'left', fontWeight: 'bold', marginTop: '10px' }}
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
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default TeacherModeQuiz;
