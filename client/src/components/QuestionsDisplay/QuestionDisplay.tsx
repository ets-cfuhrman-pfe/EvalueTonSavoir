import React from 'react';
import { Question } from 'gift-pegjs';

import TrueFalseQuestionDisplay from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import MultipleChoiceQuestionDisplay from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import NumericalQuestionDisplay from './NumericalQuestionDisplay/NumericalQuestionDisplay';
import ShortAnswerQuestionDisplay from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';
import { AnswerType, AnswerValidationResult } from 'src/pages/Student/JoinRoom/JoinRoom';
// import useCheckMobileScreen from '../../services/useCheckMobileScreen';

interface QuestionProps {
    question: Question;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    answer?: AnswerType;
    answerValidation?: AnswerValidationResult;

}
const QuestionDisplay: React.FC<QuestionProps> = ({
    question,
    handleOnSubmitAnswer,
    showAnswer,
    answer,
    answerValidation,
}) => {
    // const isMobile = useCheckMobileScreen();
    // const imgWidth = useMemo(() => {
    //     return isMobile ? '100%' : '20%';
    // }, [isMobile]);

    let questionTypeComponent = null;
    switch (question?.type) {
        case 'TF':
            questionTypeComponent = (
                <TrueFalseQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    answerValidation={answerValidation}
                />
            );
            break;
        case 'MC':
            
            questionTypeComponent = (
                <MultipleChoiceQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    answerValidation={answerValidation}
                />
            );
            break;
        case 'Numerical':
            questionTypeComponent = (
                <NumericalQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    
                />
            );
            break;
        case 'Short':
            questionTypeComponent = (
                <ShortAnswerQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                />
            );
            break;
    }
    return (
        <div className="question-container">
            {questionTypeComponent ? (
                <>
                    {questionTypeComponent}
                </>
            ) : (
                <div>Question de type inconnue</div>
            )}
        </div>
    );
};

export default QuestionDisplay;
