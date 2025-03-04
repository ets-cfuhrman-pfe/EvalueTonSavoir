import React from 'react';
import { Question } from 'gift-pegjs';

import TrueFalseQuestionDisplay from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import MultipleChoiceQuestionDisplay from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import NumericalQuestionDisplay from './NumericalQuestionDisplay/NumericalQuestionDisplay';
import ShortAnswerQuestionDisplay from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';
// import useCheckMobileScreen from '../../services/useCheckMobileScreen';

interface QuestionProps {
    question: Question;
    handleOnSubmitAnswer?: (answer: string | number | boolean) => void;
    showAnswer?: boolean;
    answer?: string | number | boolean;
}
const QuestionDisplay: React.FC<QuestionProps> = ({
    question,
    handleOnSubmitAnswer,
    showAnswer,
    answer,
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
                />
            );
            break;
        case 'Numerical':
            if (question.choices) {
                if (!Array.isArray(question.choices)) {
                    questionTypeComponent = (
                        <NumericalQuestionDisplay
                            question={question}
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            showAnswer={showAnswer}
                        />
                    );
                } else {
                    questionTypeComponent = (  // TODO fix NumericalQuestion (correctAnswers is borked)
                        <NumericalQuestionDisplay
                            question={question}
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            showAnswer={showAnswer}
                        />
                    );
                }
            }
            break;
        case 'Short':
            questionTypeComponent = (
                <ShortAnswerQuestionDisplay
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
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
