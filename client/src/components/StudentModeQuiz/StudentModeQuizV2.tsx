// StudentModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface StudentModeQuizV2Props {
    questions: QuestionType[];
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const StudentModeQuizV2: React.FC<StudentModeQuizV2Props> = ({
    questions,
    answers,
    submitAnswer,
    disconnectWebSocket
}) => {
    const [questionInfos, setQuestionInfos] = useState<QuestionType>(questions[0]);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

    const previousQuestion = () => {
        setQuestionInfos(questions[Number(questionInfos.question?.id) - 2]);        
    };

    useEffect(() => {
        const savedAnswer = answers[Number(questionInfos.question.id)-1]?.answer;
        console.log(`StudentModeQuizV2: useEffect: savedAnswer: ${savedAnswer}`);
        setIsAnswerSubmitted(savedAnswer !== undefined);
    }, [questionInfos.question, answers]);

    const nextQuestion = () => {
        setQuestionInfos(questions[Number(questionInfos.question?.id)]);
    };

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        setIsAnswerSubmitted(true);
    };

    return (
        <div className='container-fluid student-mode-quiz-mobile'>
            {/* Header */}
            <div className='row py-2 border-bottom quiz-header sticky-top'>
                <div className='col-12'>
                    <div className='d-flex align-items-center justify-content-between'>
                        {/* Left: Navigation buttons and question counter */}
                        <div className='d-flex align-items-center gap-3 p-2'>
                            <div className='d-flex gap-2 quiz-nav-buttons'>
                                <Button
                                    variant="outlined"
                                    onClick={previousQuestion}
                                    disabled={Number(questionInfos.question.id) <= 1}
                                    size="small"
                                >
                                    <ChevronLeft />
                                </Button>
                                
                                <Button
                                    variant="outlined"
                                    onClick={nextQuestion}
                                    disabled={Number(questionInfos.question.id) >= questions.length}
                                    size="small"
                                >
                                    <ChevronRight />
                                </Button>
                            </div>
                            
                            <div className='text-center'>
                                <h6 className='mb-0 question-counter'>
                                    Question {questionInfos.question.id}/{questions.length}
                                </h6>
                            </div>
                        </div>
                        
                        {/* Right: Disconnect button */}
                        <div>
                            <DisconnectButton
                                onReturn={disconnectWebSocket}
                                message={`Êtes-vous sûr de vouloir quitter?`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className='row'>
                {/* Question area */}
                <div className='col-12'>
                    <div className='p-4 quiz-question-area'>
                        <QuestionDisplayV2
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            question={questionInfos.question as Question}
                            showAnswer={isAnswerSubmitted}
                            answer={answers[Number(questionInfos.question.id)-1]?.answer}
                        />
                        
                        {/* Reserved feedback space - always present */}
                        <div className='mt-4 min-height-feedback'>
                            {/* Feedback will be displayed here when available */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentModeQuizV2;