import React from 'react';
import { Question } from 'gift-pegjs';

import TrueFalseQuestionDisplayV2 from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplayV2';
import MultipleChoiceQuestionDisplayV2 from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplayV2';
import NumericalQuestionDisplayV2 from './NumericalQuestionDisplay/NumericalQuestionDisplayV2';
import ShortAnswerQuestionDisplayV2 from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplayV2';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { StudentType } from 'src/Types/StudentType';

interface QuestionV2Props {
    question: Question;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    answer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    students?: StudentType[];
    showStatistics?: boolean;
}

const QuestionDisplayV2: React.FC<QuestionV2Props> = ({
    question,
    handleOnSubmitAnswer,
    showAnswer,
    answer,
    buttonText = 'Répondre',
    disabled = false,
    students = [],
    showStatistics = false,
}) => {
    let questionTypeComponent = null;
    switch (question?.type) {
        case 'TF':
            questionTypeComponent = (
                <TrueFalseQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                    students={students}
                    showStatistics={showStatistics}
                />
            );
            break;
        case 'MC':
            questionTypeComponent = (
                <MultipleChoiceQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                    students={students}
                    showStatistics={showStatistics}
                />
            );
            break;
        case 'Numerical':
            if (question.choices) {
                    questionTypeComponent = (
                        <NumericalQuestionDisplayV2
                            question={question}
                            handleOnSubmitAnswer={handleOnSubmitAnswer}
                            showAnswer={showAnswer}
                            passedAnswer={answer}
                            buttonText={buttonText}
                            disabled={disabled}
                        />
                    );
            }
            break;
        case 'Short':
            questionTypeComponent = (
                <ShortAnswerQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                />
            );
            break;
    }
    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    {questionTypeComponent ? (
                        <>
                            {questionTypeComponent}
                        </>
                    ) : (
                        <div className="alert alert-warning">Question de type inconnue</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplayV2;