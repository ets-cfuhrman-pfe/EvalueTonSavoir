// TrueFalseQuestion.tsx
import React, { useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { Answer } from 'src/Types/StudentType';

interface Props {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: Answer) => void;
    showAnswer?: boolean;
    passedAnswer?: string | number | boolean;
}

const TrueFalseQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer} =
        props;
    console.log("Passedanswer", passedAnswer);

    const [answer, setAnswer] = useState<boolean | undefined>(() => {
        if (typeof passedAnswer === 'boolean') {
            return passedAnswer;
        }
        return undefined;
    }); 

    const handleOnClickAnswer = (choice: boolean) => {
        setAnswer(choice);
    };

    console.log("Answer", answer);
    const selectedTrue = answer ? 'selected' : '';
    const selectedFalse = answer !== undefined && !answer ? 'selected' : '';
    return (
        <div className="question-container">
            <div className="question content">
            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            <div className="choices-wrapper mb-1">
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && handleOnClickAnswer(true)}
                    fullWidth
                >
                    {showAnswer? (<div> {(question.isTrue ? '✅' : '❌')}</div>):``}                    
                    <div className={`circle ${selectedTrue}`}>V</div>
                    <div className={`answer-text ${selectedTrue}`}>Vrai</div>
                </Button>
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && handleOnClickAnswer(false)}
                    fullWidth
                >
                    {showAnswer? (<div> {(!question.isTrue ? '✅' : '❌')}</div>):``}                    
                    <div className={`circle ${selectedFalse}`}>F</div>
                    <div className={`answer-text ${selectedFalse}`}>Faux</div>
                </Button>
            </div>
            {/* selected TRUE, show True feedback if it exists */}
            {showAnswer && answer && question.trueFormattedFeedback && (
                <div className="true-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.trueFormattedFeedback) }} />
                </div>
            )}
            {/* selected FALSE, show False feedback if it exists */}
            {showAnswer && !answer && question.falseFormattedFeedback && (
                <div className="false-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.falseFormattedFeedback) }} />
                </div>
            )}
            {question.formattedGlobalFeedback && showAnswer && (
                <div className="global-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                </div>
            )}
            {!showAnswer && handleOnSubmitAnswer && (
                <Button
                    variant="contained"
                    onClick={() =>
                        answer !== undefined && handleOnSubmitAnswer && handleOnSubmitAnswer(answer)
                    }
                    disabled={answer === undefined}
                >
                    Répondre
                </Button>
            )}
        </div>
    );
};

export default TrueFalseQuestionDisplay;
