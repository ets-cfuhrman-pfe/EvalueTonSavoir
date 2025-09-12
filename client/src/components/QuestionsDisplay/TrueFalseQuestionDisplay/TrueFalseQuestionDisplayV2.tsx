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
        }
    }, [passedAnswer]);

    const handleOnClickAnswer = (value: boolean) => {
        setAnswer(value);
    };

    const selectedTrue = answer === true ? 'selected' : '';
    const selectedFalse = answer === false ? 'selected' : '';

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
                            className={`w-100 p-3 text-start ${selectedTrue ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            onClick={() => !showAnswer && handleOnClickAnswer(true)}
                            disabled={disableButton}
                            variant="outlined"
                            style={{
                                border: selectedTrue ? '2px solid var(--bs-primary)' : '1px solid #dee2e6',
                                borderRadius: '0.5rem'
                            }}
                        >
                            <div className="d-flex align-items-center">
                                {showAnswer && (
                                    <div className="me-3 fs-5">{question.isTrue ? '✅' : '❌'}</div>
                                )}
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
                            className={`w-100 p-3 text-start ${selectedFalse ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            onClick={() => !showAnswer && handleOnClickAnswer(false)}
                            disabled={disableButton}
                            variant="outlined"
                            style={{
                                border: selectedFalse ? '2px solid var(--bs-primary)' : '1px solid #dee2e6',
                                borderRadius: '0.5rem'
                            }}
                        >
                            <div className="d-flex align-items-center">
                                {showAnswer && (
                                    <div className="me-3 fs-5">{!question.isTrue ? '✅' : '❌'}</div>
                                )}
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