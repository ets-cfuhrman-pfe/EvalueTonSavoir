// TeacherModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import QuizResults from '../QuizResults/QuizResults';
import { StudentType } from '../../Types/StudentType';
import { checkIfIsCorrect } from '../../pages/Teacher/ManageRoom/useRooms';

interface TeacherModeQuizV2Props {
    questionInfos: QuestionType;
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
    quizCompleted?: boolean;
    questions?: QuestionType[];
    studentName?: string;
}

const TeacherModeQuizV2: React.FC<TeacherModeQuizV2Props> = ({
    questionInfos,
    answers,
    submitAnswer,
    disconnectWebSocket,
    quizCompleted = false,
    questions = [],
    studentName
}) => {
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [answer, setAnswer] = useState<AnswerType>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasShownModalOnce, setHasShownModalOnce] = useState(false);

    // arrive here the first time after waiting for next question
    useEffect(() => {
        const oldAnswer = answers[Number(questionInfos.question.id) -1 ]?.answer;
        setAnswer(oldAnswer);
        // Reset validation state when question changes to prevent flash
        setIsAnswerSubmitted(false);
    }, [questionInfos?.question, answers]);

    // handle answer submission state
    useEffect(() => {
        setIsAnswerSubmitted(answer !== undefined);
    }, [answer]);

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        if (shouldShowResults) {
            // Quiz is completed, show results instead of submitting
            setIsModalOpen(true);
        } else {
            // Quiz is still in progress, submit the answer
            const idQuestion = Number(questionInfos.question.id) || -1;
            submitAnswer(answer, idQuestion);
        }
    };

    // Check if student has answered all questions
    const hasAnsweredAllQuestions = questions && questions.length > 0 && 
        answers.length === questions.length && 
        answers.every(answer => answer?.answer !== undefined);

    // Check if we should show results (quiz completed or all questions answered)
    const shouldShowResults = hasAnsweredAllQuestions || quizCompleted;

    // Auto-show modal on first completion
    useEffect(() => {
        if (shouldShowResults && !hasShownModalOnce && questions && questions.length > 0 && studentName) {
            setIsModalOpen(true);
            setHasShownModalOnce(true);
        }
    }, [shouldShowResults, hasShownModalOnce, questions, studentName]);

    // Determine button text based on quiz completion status
    const buttonText = shouldShowResults ? 'Voir les résultats' : 'Répondre';

    // Render modal if quiz is completed
    const renderModal = () => {
        if (!shouldShowResults || !questions || questions.length === 0 || !studentName) {
            return null;
        }

        const currentStudent: StudentType = {
            id: 'current-student',
            name: studentName,
            answers: answers.map((answer, index) => ({
                idQuestion: index + 1,
                answer: answer?.answer,
                isCorrect: answer?.answer ? checkIfIsCorrect(answer.answer, index + 1, questions) : false
            }))
        };

        return (
            <QuizResults
                students={[currentStudent]}
                questions={questions}
                isStudentView={true}
                currentStudent={currentStudent}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        );
    };

    return (
        <>
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
                                buttonText={buttonText}
                            />
                            
                            {/* Reserved feedback space - always present */}
                            <div className='mt-4 min-height-feedback'>
                                {/* Feedback will be displayed here when available */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {renderModal()}
        </>
    );
};

export default TeacherModeQuizV2;