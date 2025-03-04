// StudentModeQuiz.tsx
import React, { useEffect, useState } from 'react';
import QuestionComponent from '../QuestionsDisplay/QuestionDisplay';
import '../../pages/Student/JoinRoom/joinRoom.css';
import { QuestionType } from '../../Types/QuestionType';
// import { QuestionService } from '../../services/QuestionService';
import { Button } from '@mui/material';
//import QuestionNavigation from '../QuestionNavigation/QuestionNavigation';
//import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { Question } from 'gift-pegjs';

interface StudentModeQuizProps {
    questions: QuestionType[];
    submitAnswer: (answer: string | number | boolean, idQuestion: number) => void;
    disconnectWebSocket: () => void;
}

const StudentModeQuiz: React.FC<StudentModeQuizProps> = ({
    questions,
    submitAnswer,
    disconnectWebSocket
}) => {
    //Ajouter type AnswerQuestionType en remplacement de QuestionType
    const [questionInfos, setQuestion] = useState<QuestionType>(questions[0]);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    // const [imageUrl, setImageUrl] = useState('');

    const previousQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id) - 2]);
        setIsAnswerSubmitted(false);
        
    };

    useEffect(() => {        
        const answer = localStorage.getItem(`Answer${questionInfos.question.id}`);
        if (answer !== null) {
            setIsAnswerSubmitted(true);
        } else {
            setIsAnswerSubmitted(false);

        }
    }, [questionInfos.question]);

    const nextQuestion = () => {
        setQuestion(questions[Number(questionInfos.question?.id)]);
        setIsAnswerSubmitted(false);
        
    };

    const handleOnSubmitAnswer = (answer: string | number | boolean) => {
        const idQuestion = Number(questionInfos.question.id) || -1;
        submitAnswer(answer, idQuestion);
        setIsAnswerSubmitted(true);
    };

    return (
    <div className='room'>
    <div className='roomHeader'>
        <DisconnectButton
            onReturn={disconnectWebSocket}
            message={`Êtes-vous sûr de vouloir quitter?`} />

    </div>
    <div >
    <b>Question {questionInfos.question.id}/{questions.length}</b>
    </div>
        <div className="overflow-auto">
            <div className="question-component-container">
                <div className="mb-5">
                    {/* <QuestionNavigation
                        currentQuestionId={Number(questionInfos.question.id)}
                        questionsLength={questions.length}
                        previousQuestion={previousQuestion}
                        nextQuestion={nextQuestion}
                        /> */}
                </div>
                <QuestionComponent
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    question={questionInfos.question as Question}
                    showAnswer={isAnswerSubmitted}
                    answer={localStorage.getItem(`Answer${questionInfos.question.id}`) || undefined}
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
