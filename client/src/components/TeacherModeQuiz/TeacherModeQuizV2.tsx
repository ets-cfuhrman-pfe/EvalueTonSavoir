// TeacherModeQuizV2.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import WaitingForNextQuestion from './WaitingForNextQuestion';
import { QuestionType } from '../../Types/QuestionType';
import { Chip } from '@mui/material';
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
    roomName?: string;
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
    studentName,
    roomName,
}) => {
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    const [answer, setAnswer] = useState<AnswerType>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // arrive here the first time after waiting for next question
    useEffect(() => {
        setIsAnswerSubmitted(false); // Reset to prevent flash
        const answerSubmission = answers[Number(questionInfos.question.id) - 1];
        const oldAnswer = answerSubmission?.answer;
        setAnswer(oldAnswer);
        // Set answer submission state based on whether answer exists and is not just an empty object
        setIsAnswerSubmitted(oldAnswer !== undefined && answerSubmission?.roomName !== undefined);
    }, [questionInfos?.question, answers]);

    const handleOnSubmitAnswer = (submittedAnswer: AnswerType) => {
        if (!isAnswerSubmitted) {
            const idQuestion = Number(questionInfos.question.id) || -1;
            submitAnswer(submittedAnswer, idQuestion);
            setAnswer(submittedAnswer);
            setIsAnswerSubmitted(true);
        }
    };

    // Check if student has answered all questions
    const hasAnsweredAllQuestions = questions && questions.length > 0 &&
        answers.length === questions.length &&
        answers.every(answer => answer?.answer !== undefined && answer?.roomName !== undefined);

    // Check if we should show results (quiz completed or all questions answered)
    const shouldShowResults = hasAnsweredAllQuestions || quizCompleted;

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
                        {/* Left: Quiz title, room name, and question counter */}
                        <div className='d-flex align-items-center gap-2 p-2'>
                            {quizTitle && <h6 className='mb-0 fw-bold'>{quizTitle}</h6>}
                            {roomName && <Chip label={`Salle : ${roomName}`} size="small" sx={{ fontWeight: 'bold' }} />}
                            <span className='question-counter px-1'>
                                {questionInfos.question.id}{totalQuestions ? `/${totalQuestions}` : ''}
                            </span>
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
                <div className='col-12'>
                    <div className='p-4'>
                        {/* State 1: Quiz completed — show waiting page with results button */}
                        {shouldShowResults && (
                            <WaitingForNextQuestion
                                onViewResults={() => setIsModalOpen(true)}
                            />
                        )}

                        {/* State 2: Answer submitted, waiting for next question */}
                        {!shouldShowResults && isAnswerSubmitted && (
                            <WaitingForNextQuestion />
                        )}

                        {/* State 3: Awaiting answer — show the question form */}
                        {!shouldShowResults && !isAnswerSubmitted && (
                            <QuestionDisplayV2
                                key={questionInfos.question.id}
                                handleOnSubmitAnswer={handleOnSubmitAnswer}
                                question={questionInfos.question as Question}
                                showAnswer={false}
                                answer={answer}
                                buttonText='Répondre'
                                hideAnswerFeedback={true}
                                showCorrectnessBanner={false}
                                sideImageLayout={true}
                            />
                        )}
                    </div>
                </div>
            </div>
            {renderModal()}
        </div>
    );
};

export default TeacherModeQuizV2;
