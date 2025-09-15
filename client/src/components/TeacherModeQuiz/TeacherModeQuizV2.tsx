// TeacherModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
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
    const [answer, setAnswer] = useState<AnswerType>();

    // arrive here the first time after waiting for next question
    useEffect(() => {
        console.log(`TeacherModeQuizV2: useEffect: answers: ${JSON.stringify(answers)}`);
        console.log(`TeacherModeQuizV2: useEffect: questionInfos.question.id: ${questionInfos.question.id} answer: ${answer}`);
        const oldAnswer = answers[Number(questionInfos.question.id) -1 ]?.answer;
        console.log(`TeacherModeQuizV2: useEffect: oldAnswer: ${oldAnswer}`);
        setAnswer(oldAnswer);
        // Reset validation state when question changes to prevent flash
        setIsAnswerSubmitted(false);
    }, [questionInfos.question, answers]);

    // handle answer submission state
    useEffect(() => {
        console.log(`TeacherModeQuizV2: useEffect: answer: ${answer}`);
        setIsAnswerSubmitted(answer !== undefined);
    }, [answer]);

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
    };

    return (
        <div className='container-fluid'>
            {/* Header */}
            <div className='row py-2 border-bottom quiz-header sticky-top'>
                <div className='col-12'>
                    <div className='d-flex align-items-center justify-content-between'>
                        {/* Left: Question counter and waiting message */}
                        <div className='d-flex align-items-center'>
                            <div className='text-start'>
                                <h6 className='mb-0 question-counter'>
                                    Question {questionInfos.question.id}
                                </h6>
                                <div className={`text-muted small mt-1 ${isAnswerSubmitted ? '' : 'invisible'}`}>
                                    En attente pour la prochaine question...
                                </div>
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
                {/* Question area - takes full width, left-aligned */}
                <div className='col-12'>
                    <div className='p-4'>
                        <QuestionDisplayV2
                            key={questionInfos.question.id} // Force remount on question change to prevent flicker
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            question={questionInfos.question as Question}
                            showAnswer={isAnswerSubmitted}
                            answer={answer}
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

export default TeacherModeQuizV2;