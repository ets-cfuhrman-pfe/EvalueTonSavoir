import React, { useState } from 'react';
import { Question } from 'gift-pegjs';

import { FormControlLabel, Switch } from '@mui/material';

import TrueFalseQuestionDisplay from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import MultipleChoiceQuestionDisplay from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import NumericalQuestionDisplay from './NumericalQuestionDisplay/NumericalQuestionDisplay';
import ShortAnswerQuestionDisplay from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
// import useCheckMobileScreen from '../../services/useCheckMobileScreen';

import { StudentType } from '../../Types/StudentType';

interface QuestionProps {
    question: Question;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    students?: StudentType[];
    showResults?: boolean;
    showAnswerToggle?: boolean;
    answer?: AnswerType;

}
const QuestionDisplay: React.FC<QuestionProps> = ({
    question,
    handleOnSubmitAnswer,
    showAnswer,
    showAnswerToggle = false,
    students,
    answer,
}) => {
    // const isMobile = useCheckMobileScreen();
    // const imgWidth = useMemo(() => {
    //     return isMobile ? '100%' : '20%';
    // }, [isMobile]);
    
    const [showResults, setShowResults] = useState<boolean>(false);

    let questionTypeComponent = null;
    switch (question?.type) {
        case 'TF':
            questionTypeComponent = (
                <TrueFalseQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    students={students}
                    showResults={showResults}
                    passedAnswer={answer}
                />
            );
            break;
        case 'MC':
            
            questionTypeComponent = (
                <MultipleChoiceQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    students={students}
                    showResults={showResults}
                    passedAnswer={answer}
                />
            );
            break;
        case 'Numerical':
            if (question.choices) {
                    questionTypeComponent = (
                        <NumericalQuestionDisplay
                            question={question}
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            showAnswer={showAnswer}
                            passedAnswer={answer}
                            students={students}
                            showResults={showResults}
                        />
                    );
            }
            break;
        case 'Short':
            questionTypeComponent = (
                <ShortAnswerQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    students={students}
                    showResults={showResults}
                    passedAnswer={answer}
                />
            );
            break;
    }
    return (
        <>
            {showAnswerToggle && (
                <FormControlLabel
                    label={<div className="text-sm">Afficher les résultats</div>}
                    control={
                        <Switch
                            value={showResults}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setShowResults(e.target.checked)
                            }
                        />
                    }
                />
            )}

            <div className="question-container">
                {questionTypeComponent ? (
                    <>
                        {questionTypeComponent}
                    </>
                ) : (
                    <div>Question de type inconnue</div>
                )}
            </div>
        </>
    );
};

export default QuestionDisplay;
