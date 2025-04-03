// StudentModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionComponent from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { QuestionType } from '../../Types/QuestionType';
import { Button } from '@mui/material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';
import { AnswerSubmissionToBackendType } from 'src/services/WebsocketService';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

interface StudentModeQuizProps {
    questions: QuestionType[];
    answers: AnswerSubmissionToBackendType[];
    submitAnswer: (_answer: AnswerType, _idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const StudentModeQuiz: React.FC<StudentModeQuizProps> = ({
    questions,
    answers,
    submitAnswer,
    disconnectWebSocket
}) => {
    const { setShowAnswer } = useQuizContext(); // Access setShowAnswer from context

    const [questionInfos, setQuestion] = useState<QuestionType>(questions[0]);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

    const previousQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id) - 2]);
    };

    useEffect(() => {
        const savedAnswer = answers[Number(questionInfos.question.id) - 1]?.answer;
        console.log(`StudentModeQuiz: useEffect: savedAnswer: ${savedAnswer}`);
        setIsAnswerSubmitted(savedAnswer !== undefined);
        setShowAnswer(savedAnswer !== undefined); // Update showAnswer in context
    }, [questionInfos.question, answers, setShowAnswer]);

    const nextQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id)]);
    };

    const handleOnSubmitAnswer = (answer: AnswerType) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        setIsAnswerSubmitted(true);
        setShowAnswer(true); // Update showAnswer in context when an answer is submitted
    };

    return (
        <div className="room">
            <div className="roomHeader">
                <DisconnectButton
                    onReturn={disconnectWebSocket}
                    message={`Êtes-vous sûr de vouloir quitter?`}
                />
            </div>
            <div>
                <b>Question {questionInfos.question.id}/{questions.length}</b>
            </div>
            <div className="overflow-auto">
                <div className="question-component-container">
                    <QuestionComponent
                        handleOnSubmitAnswer={handleOnSubmitAnswer}
                        question={questionInfos.question as Question}
                        showAnswer={isAnswerSubmitted} // Local state for showing answers
                        answer={answers[Number(questionInfos.question.id) - 1]?.answer}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '1rem' }}>
                        <div>
                            <Button
                                variant="outlined"
                                onClick={previousQuestion}
                                fullWidth
                                disabled={Number(questionInfos.question.id) <= 1}
                            >
                                Question précédente
                            </Button>
                        </div>
                        <div>
                            <Button
                                variant="outlined"
                                onClick={nextQuestion}
                                fullWidth
                                disabled={Number(questionInfos.question.id) >= questions.length}
                            >
                                Question suivante
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentModeQuiz;
