// TeacherModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import QuizResults from '../QuizResults/QuizResults';
import { Student, Answer } from '../../Types/StudentType';
import { checkIfIsCorrect } from '../../pages/Teacher/ManageRoom/useRooms';

interface TeacherModeQuizV2Props {
    questionInfos: QuestionType;
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
    quizTitle?: string;
    totalQuestions?: number;
    quizCompleted?: boolean;
    questions?: QuestionType[];
    studentName?: string;
}

const TeacherModeQuizV2: React.FC<TeacherModeQuizV2Props> = ({
    questionInfos,
    answers,
    submitAnswer,
    disconnectWebSocket,
    quizTitle,
    totalQuestions,
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
        setIsAnswerSubmitted(false); // Reset to prevent flash
        const answerSubmission = answers[Number(questionInfos.question.id) - 1];
        const oldAnswer = answerSubmission?.answer;
        setAnswer(oldAnswer);
        // Set answer submission state based on whether answer exists and is not just an empty object
        setIsAnswerSubmitted(oldAnswer !== undefined && answerSubmission?.roomName !== undefined);
    }, [questionInfos?.question, answers]);

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        if (shouldShowResults) {
            // Quiz is completed, show results instead of submitting
            setIsModalOpen(true);
        } else if (!isAnswerSubmitted) {
            // Quiz is still in progress and no answer submitted yet, submit the answer
            const idQuestion = Number(questionInfos.question.id) || -1;
            submitAnswer(answer, idQuestion);
            setAnswer(answer);
            setIsAnswerSubmitted(true);
        }
    };

    // Check if student has answered all questions
    const hasAnsweredAllQuestions = questions && questions.length > 0 && 
        answers.length === questions.length && 
        answers.every(answer => answer?.answer !== undefined && answer?.roomName !== undefined);

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
    let buttonText = 'Répondre';
    if (shouldShowResults) {
        buttonText = 'Voir les résultats';
    }

    // Render modal if quiz is completed
    const renderModal = () => {
        if (!shouldShowResults || !questions || questions.length === 0 || !studentName) {
            return null;
        }

        const currentStudent: Student = new Student(
            studentName,
            'current-student',
            'current-room',
            answers.map((answer, index) => new Answer(
                answer?.answer,
                answer?.answer ? checkIfIsCorrect(answer.answer, index + 1, questions) : false,
                index + 1
            ))
        );

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
        <div className='container-fluid'>
            {/* Header */}
            <div className='row py-2 border-bottom quiz-header sticky-top'>
                <div className='col-12'>
                    <div className='d-flex align-items-center justify-content-between'>
                        {/* Left: Quiz title */}
                        <div className='d-flex align-items-center'>
                            {quizTitle && <h6 className='mb-0 fw-bold me-3'>{quizTitle}</h6>}
                        </div>
                        
                        {/* Right: Disconnect button */}
                        <div>
                            <DisconnectButton
                                onReturn={disconnectWebSocket}
                                askConfirm={!shouldShowResults}
                                message={`Êtes-vous sûr de vouloir quitter? Vos réponses seront perdues.`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className='row'>
                {/* Question area */}
                <div className='col-12'>
                    <div className='p-4'>
                         <div className="d-flex justify-content-between align-items-center mb-3 border-bottom-light">
                            <h6 className='mb-0 question-counter'>
                                {questionInfos.question.id}{totalQuestions ? `/${totalQuestions}` : ''}
                            </h6>
                            <div className={`text-muted small ${isAnswerSubmitted ? '' : 'invisible'}`}>
                                En attente pour la prochaine question...
                            </div>
                        </div>
                        <QuestionDisplayV2
                            key={questionInfos.question.id} // Force remount on question change to prevent flicker
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            question={questionInfos.question as Question}
                            showAnswer={isAnswerSubmitted}
                            answer={answer}
                            buttonText={buttonText}
                            hideAnswerFeedback={true}
                        />
                    </div>
                </div>
            </div>
            {renderModal()}
        </div>
    );
};

export default TeacherModeQuizV2;