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
    const [questionInfos, setQuestion] = useState<QuestionType>(questions[0]);
    const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
    // const [imageUrl, setImageUrl] = useState('');

    // const previousQuestion = () => {
    //     setQuestion(questions[Number(questionInfos.question?.id) - 2]);
    //     setIsAnswerSubmitted(false);
    // };

    useEffect(() => {}, [questionInfos]);

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
                    />
                <div className="center-h-align mt-1/2">
                    <div className="w-12">
                        {/* <Button
                            variant="outlined"
                            onClick={previousQuestion}
                            fullWidth
                            startIcon={<ChevronLeft />}
                            disabled={Number(questionInfos.question.id) <= 1}
                            >
                            Question précédente
                        </Button> */}
                    </div>
                    <div className="w-12">
                        <Button style={{ display: isAnswerSubmitted ? 'block' : 'none' }}
                            variant="outlined"
                            onClick={nextQuestion}
                            fullWidth
                            //endIcon={<ChevronRight />}
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
