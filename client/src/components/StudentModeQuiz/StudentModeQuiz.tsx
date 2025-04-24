// StudentModeQuiz.tsx
import React, { useEffect } from 'react';
import QuestionDisplay from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { Button } from '@mui/material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

const StudentModeQuiz: React.FC = () => {
    const { questions, answers, setIsQuestionSent, disconnectWebSocket, setShowAnswer, index, updateIndex } = useQuizContext(); // Access setShowAnswer from context

    const previousQuestion = () => {
        updateIndex(Number(index) - 1);
    };

    useEffect(() => {
        let savedAnswer = undefined;
        console.log(`StudentModeQuiz: useEffect: index: ${index}`);
        if (answers.length === 0) {
            savedAnswer = answers[Number(index) - 1]?.answer;}

        console.log(`StudentModeQuiz: useEffect: savedAnswer: ${savedAnswer}`);
        setIsQuestionSent(savedAnswer !== undefined);
        setShowAnswer(savedAnswer !== undefined); // Update showAnswer in context
    }, [index, answers, setShowAnswer]);

    const nextQuestion = () => {
        updateIndex(Number(index)+1);
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
                <b>Question {Number(index) +1}/{questions.length}</b>
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
                                disabled={Number(index) +1 <= 1}
                            >
                                Question précédente
                            </Button>
                        </div>
                        <div>
                            <Button
                                variant="outlined"
                                onClick={nextQuestion}
                                fullWidth
                                disabled={Number(index) >= questions.length -1}
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
