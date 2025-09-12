// TeacherModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface TeacherModeQuizV2Props {
    questionInfos: QuestionType;
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const TeacherModeQuizV2: React.FC<TeacherModeQuizV2Props> = ({
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
        console.log(`TeacherModeQuizV2: useEffect: answers: ${JSON.stringify(answers)}`);
        console.log(`TeacherModeQuizV2: useEffect: questionInfos.question.id: ${questionInfos.question.id} answer: ${answer}`);
        const oldAnswer = answers[Number(questionInfos.question.id) -1 ]?.answer;
        console.log(`TeacherModeQuizV2: useEffect: oldAnswer: ${oldAnswer}`);
        setAnswer(oldAnswer);
        setIsFeedbackDialogOpen(false);
    }, [questionInfos.question, answers]);

    // handle showing the feedback dialog
    useEffect(() => {
        console.log(`TeacherModeQuizV2: useEffect: answer: ${answer}`);
        setIsAnswerSubmitted(answer !== undefined);
        setIsFeedbackDialogOpen(answer !== undefined);
    }, [answer]);

    useEffect(() => {
        console.log(`TeacherModeQuizV2: useEffect: isAnswerSubmitted: ${isAnswerSubmitted}`);
        setIsFeedbackDialogOpen(isAnswerSubmitted);
    }, [isAnswerSubmitted]);

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        setIsFeedbackDialogOpen(true);
    };

    const handleFeedbackDialogClose = () => {
        setIsFeedbackDialogOpen(false);
        setIsAnswerSubmitted(true);
    };

    return (
        <div className='container-fluid'>
            {/* Header with disconnect button and question number */}
            <div className='row py-3 border-bottom'>
                <div className='col-12 d-flex justify-content-between align-items-center'>
                    <DisconnectButton
                        onReturn={disconnectWebSocket}
                        message={`Êtes-vous sûr de vouloir quitter?`} />
                    
                    <div className='text-center flex-grow-1'>
                        <h4 className='mb-0'>Question {questionInfos.question.id}</h4>
                    </div>
                    
                    <div style={{width: '120px'}}></div>
                </div>
            </div>

            {/* Main content area */}
            <div className='row'>
                {/* Question area - takes full width, left-aligned */}
                <div className='col-12'>
                    <div className='p-4'>
                        {isAnswerSubmitted ? (
                            <div className='text-center py-5'>
                                <h5 className='text-muted'>En attente pour la prochaine question...</h5>
                            </div>
                        ) : (
                            <>
                                <QuestionDisplayV2
                                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                                    question={questionInfos.question as Question}
                                    answer={answer}
                                />
                                
                                {/* Reserved feedback space - always present */}
                                <div className='mt-4 min-height-feedback'>
                                    {/* Feedback will be displayed here when available */}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Feedback Dialog remains unchanged */}
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

                    <QuestionDisplayV2
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

export default TeacherModeQuizV2;