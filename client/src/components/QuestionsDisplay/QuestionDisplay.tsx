import React from 'react';
import { Question } from 'gift-pegjs';
import TrueFalseQuestionDisplay from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplay';
import MultipleChoiceQuestionDisplay from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplay';
import NumericalQuestionDisplay from './NumericalQuestionDisplay/NumericalQuestionDisplay';
import ShortAnswerQuestionDisplay from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplay';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

const QuestionDisplay: React.FC = () => {
    const { questions, index } = useQuizContext();
    const question = questions[Number(index)].question as Question;
    let questionTypeComponent = null;

    switch (question?.type) {
        case 'TF':
            questionTypeComponent = (
                <TrueFalseQuestionDisplay
                />
            );
            break;
        case 'MC':

            questionTypeComponent = (
                <MultipleChoiceQuestionDisplay
                />
            );
            break;
        case 'Numerical':
            if (question.choices) {
                questionTypeComponent = (
                    <NumericalQuestionDisplay
                    />
                );
            }
            break;
        case 'Short':
            questionTypeComponent = (
                <ShortAnswerQuestionDisplay
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
