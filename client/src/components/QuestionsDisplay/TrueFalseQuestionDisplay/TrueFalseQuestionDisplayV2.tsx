// TrueFalseQuestionDisplayV2.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface PropsV2 {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
}

const TrueFalseQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } = props;

    const [answer, setAnswer] = useState<boolean | undefined>(() => {
        if (passedAnswer && (passedAnswer[0] === true || passedAnswer[0] === false)) {
            return passedAnswer[0];
        }
        return undefined;
    });

    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        if (passedAnswer && (passedAnswer[0] === true || passedAnswer[0] === false)) {
            setAnswer(passedAnswer[0]);
        } else {
            setAnswer(undefined);
        }
    }, [passedAnswer, question.id]);

    const handleOnClickAnswer = (value: boolean) => {
        setAnswer(value);
    };

    // Prevent validation styling from showing immediately on question change
    const shouldShowValidation = showAnswer && answer !== undefined;
    const selectedTrue = answer === true ? 'selected' : '';
    const selectedFalse = answer === false ? 'selected' : '';

    // Compute class names for buttons
    const trueColorClass = shouldShowValidation 
        ? (question.isTrue ? 'bg-success text-white' : 'bg-danger text-white') 
        : (selectedTrue ? 'bg-primary text-white' : 'bg-light text-dark');
    const trueValidationClass = shouldShowValidation && selectedTrue ? 'choice-button-validated-selected' : '';

    const falseColorClass = shouldShowValidation 
        ? (!question.isTrue ? 'bg-success text-white' : 'bg-danger text-white') 
        : (selectedFalse ? 'bg-primary text-white' : 'bg-light text-dark');
    const falseValidationClass = shouldShowValidation && selectedFalse ? 'choice-button-validated-selected' : '';

    return (
        <div className="quiz-question-area">
            {/* Question text */}
            <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>

            {/* True/False choices */}
            <div className="mb-4">
                <div className="row g-3">
                    <div className="col-md-6">
                        <Button
                            className={`w-100 p-3 text-start choice-button ${trueColorClass} ${trueValidationClass}`}
                            onClick={() => !shouldShowValidation && handleOnClickAnswer(true)}
                            disabled={disableButton}
                            variant="outlined"
                        >
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <strong>Vrai</strong>
                                </div>
                            </div>
                        </Button>
                        {showAnswer && answer && question.trueFormattedFeedback && (
                            <div className="mt-2">
                                <div className="alert alert-info small">
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.trueFormattedFeedback) }} />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="col-md-6">
                        <Button
                            className={`w-100 p-3 text-start choice-button ${falseColorClass} ${falseValidationClass}`}
                            onClick={() => !shouldShowValidation && handleOnClickAnswer(false)}
                            disabled={disableButton}
                            variant="outlined"
                        >
                            <div className="d-flex align-items-center">
                                <div className="flex-grow-1">
                                    <strong>Faux</strong>
                                </div>
                            </div>
                        </Button>
                        {showAnswer && !answer && question.falseFormattedFeedback && (
                            <div className="mt-2">
                                <div className="alert alert-info small">
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.falseFormattedFeedback) }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit button */}
            {!showAnswer && handleOnSubmitAnswer && (
                <div className="d-grid gap-2 mb-4">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() =>
                            answer !== undefined && handleOnSubmitAnswer?.([answer])
                        }
                        disabled={answer === undefined}
                        className="btn-primary"
                    >
                        Répondre
                    </Button>
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column" style={{minHeight: '5rem'}}>
                {question.formattedGlobalFeedback && showAnswer && (
                    <div className="alert alert-warning">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrueFalseQuestionDisplayV2;