// StudentModeQuizV2.tsx
import React, { useState, useEffect } from 'react';
import QuestionDisplayV2 from '../QuestionsDisplay/QuestionDisplayV2';
import { QuestionType } from '../../Types/QuestionType';
import { Button } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import QuizResults from '../QuizResults/QuizResults';
import { Student, Answer } from '../../Types/StudentType';
import { checkIfIsCorrect } from '../../pages/Teacher/ManageRoom/useRooms';

interface StudentModeQuizV2Props {
    questions: QuestionType[];
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
    studentName?: string;
    quizTitle?: string;
    quizCompleted?: boolean;
}

const StudentModeQuizV2: React.FC<StudentModeQuizV2Props> = ({
    questions,
    answers,
    submitAnswer,
    disconnectWebSocket,
    studentName,
    quizTitle,
    quizCompleted = false
}) => {
    const [questionInfos, setQuestionInfos] = useState<QuestionType>(questions[0]);
    const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
    const [hideFeedback, setHideFeedback] = useState(true);

    const hasFeedback = (question: Question) => {
        if (!question) return false;

        // Multiple choice: per-choice feedback or global feedback
        if (question.type === 'MC') {
            const mc = question as any;
            const choiceFeedback = Array.isArray(mc.choices) && mc.choices.some((c: any) => c?.formattedFeedback);
            return Boolean(mc?.formattedGlobalFeedback || choiceFeedback);
        }

        // True/False: true/false feedback or global feedback
        if (question.type === 'TF') {
            const tf = question as any;
            return Boolean(tf?.formattedGlobalFeedback || tf?.trueFormattedFeedback || tf?.falseFormattedFeedback);
        }

        // Other types: fallback to global feedback if present
        return Boolean((question as any)?.formattedGlobalFeedback);
    };

    // Check if quiz is completed (all questions answered OR teacher ended quiz)
    const isQuizCompleted = answers.length === questions.length && answers.every(answer => answer?.answer !== undefined);
    const shouldShowResults = isQuizCompleted || quizCompleted;

    // Always re-show feedback when moving to a different question
    useEffect(() => {
        setHideFeedback(true);
    }, [questionInfos.question?.id]);

    const previousQuestion = () => {
        setQuestionInfos(questions[Number(questionInfos.question?.id) - 2]);
    };

    const nextQuestion = () => {
        setQuestionInfos(questions[Number(questionInfos.question?.id)]);
    };

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        if (shouldShowResults) {
            // Quiz is completed, show results instead of submitting
            setIsResultsModalOpen(true);
        } else {
            // Quiz is still in progress, submit the answer
            const idQuestion = Number(questionInfos.question.id) || -1;
            submitAnswer(answer, idQuestion);
        }
    };

    // Compute if answer is submitted for current question
    const answerSubmission = answers[Number(questionInfos.question.id) - 1];
    const isAnswerSubmitted = answerSubmission?.answer !== undefined && answerSubmission?.roomName !== undefined;
    const canToggleFeedback = (isAnswerSubmitted || shouldShowResults) && hasFeedback(questionInfos.question as Question);

    // Create a student object for the current student
    const currentStudent: Student = new Student(
        studentName || 'Vous',
        'current-student',
        'current-room',
        answers.map((answer, index) => new Answer(
            answer?.answer,
            answer?.answer ? checkIfIsCorrect(answer.answer, index + 1, questions) : false,
            index + 1
        ))
    );

    return (
        <div className="container-fluid student-mode-quiz-mobile">
            {/* Header */}
            <div className="row py-2 border-bottom quiz-header sticky-top">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between">
                        {/* Left: Quiz title and navigation buttons */}
                        <div className="d-flex align-items-center gap-3 p-2">
                            {quizTitle && <h6 className='mb-0 fw-bold me-3'>{quizTitle}</h6>}
                            <div className="d-flex gap-2 quiz-nav-buttons">
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
                        </div>

                        {/* Right: Disconnect button */}
                        <div>
                            <DisconnectButton
                                onReturn={disconnectWebSocket}
                                askConfirm={!shouldShowResults}
                                message={`Êtes-vous sûr de vouloir quitter? Vos réponses seront perdues.`}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content area */}
            <div className="row">
                {/* Question area */}
                <div className="col-12">
                    <div className="p-4 quiz-question-area">
                        <div className="text-start mb-3 border-bottom-light">
                            <h4 className="mb-0 question-counter">
                                Question {questionInfos.question.id}/{questions.length}
                            </h4>
                        </div>

                        <QuestionDisplayV2
                            key={questionInfos.question.id} // Force remount on question change to prevent flicker
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            question={questionInfos.question as Question}
                            showAnswer={isAnswerSubmitted}
                            answer={answers[Number(questionInfos.question.id)-1]?.answer}
                            buttonText={shouldShowResults ? 'Voir les résultats' : 'Répondre'}
                            hideAnswerFeedback={hideFeedback}
                        />

                        {canToggleFeedback && (
                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="d-grid gap-2 mt-3 mb-4">
                                            <Button
                                                variant="outlined"
                                                size="large"
                                                className="quiz-feedback-toggle-btn w-100"
                                                onClick={() => setHideFeedback((prev) => !prev)}
                                            >
                                                {hideFeedback ? 'Afficher rétroactions' : 'Masquer rétroactions'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quiz Results Modal */}
            <QuizResults
                students={[currentStudent]}
                questions={questions}
                quizTitle={quizTitle}
                isStudentView={true}
                currentStudent={currentStudent}
                isOpen={isResultsModalOpen}
                onClose={() => setIsResultsModalOpen(false)}
            />
        </div>
    );
};

export default StudentModeQuizV2;