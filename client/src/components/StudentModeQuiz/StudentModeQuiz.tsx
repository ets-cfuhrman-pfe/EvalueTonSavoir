// StudentModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionDisplay from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { QuestionType } from '../../Types/QuestionType';
import { Button } from '@mui/material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

const StudentModeQuiz: React.FC = () => {
    const { questions, answers, setIsQuestionSent, disconnectWebSocket, setShowAnswer } = useQuizContext(); // Access setShowAnswer from context

    const [questionInfos, setQuestion] = useState<QuestionType>(questions[0]);

    const previousQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id) - 2]);
    };

    useEffect(() => {
        const savedAnswer = answers[Number(questionInfos.question.id) - 1]?.answer;
        console.log(`StudentModeQuiz: useEffect: savedAnswer: ${savedAnswer}`);
        setIsQuestionSent(savedAnswer !== undefined);
        setShowAnswer(savedAnswer !== undefined); // Update showAnswer in context
    }, [questionInfos.question, answers, setShowAnswer]);

    const nextQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id)]);
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
                    <QuestionDisplay/>
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
