// TrueFalseQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { AnswerType, AnswerValidationResult } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    answerValidation?: AnswerValidationResult;
}

const TrueFalseQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, answerValidation } =
        props;

    // Early return if question is not available
    if (!question) {
        return <div>Question not available</div>;
    }

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
        console.log("passedAnswer", passedAnswer);
        if (passedAnswer && (passedAnswer[0] === true || passedAnswer[0] === false)) {
            setAnswer(passedAnswer[0]);
        } else {
            setAnswer(undefined);
        }
    }, [passedAnswer, question.id]);

    const handleOnClickAnswer = (choice: boolean) => {
        setAnswer(choice);
    };

    const selectedTrue = answer ? 'selected' : '';
    const selectedFalse = answer !== undefined && !answer ? 'selected' : '';

    const getAnswerIcon = (buttonValue: boolean) => {
        if (!showAnswer) return null;
        
        if (answer === buttonValue) {
            // Selected answer
            return answerValidation?.isCorrect ? '✅' : '❌';
        } else {
            // Unselected answer - show ❌ for wrong answers
            return '❌';
        }
    };
    return (
        <div className="question-container">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ 
                    __html: question?.formattedStem ? (() => {
                        try {
                            return FormattedTextTemplate(question.formattedStem);
                        } catch (error) {
                            console.error('Error formatting question stem:', error);
                            return question.formattedStem.text || '';
                        }
                    })() : ''
                }} />
            </div>
            <div className="choices-wrapper mb-1">
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && handleOnClickAnswer(true)}
                    fullWidth
                    disabled={disableButton}
                >
                    {(() => {
                        const icon = getAnswerIcon(true);
                        return icon ? <div>{icon}</div> : null;
                    })()}
                    <div className={`answer-text ${selectedTrue}`}>Vrai</div>

                    {showAnswer && answer && question?.trueFormattedFeedback && (
                        <div className="true-feedback mb-2">
                            <div dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                    try {
                                        return FormattedTextTemplate(question.trueFormattedFeedback);
                                    } catch (error) {
                                        console.error('Error formatting true feedback:', error);
                                        return question.trueFormattedFeedback.text || '';
                                    }
                                })()
                            }} />
                        </div>
                    )}
                </Button>
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && handleOnClickAnswer(false)}
                    fullWidth
                    disabled={disableButton}

                >
                    {(() => {
                        const icon = getAnswerIcon(false);
                        return icon ? <div>{icon}</div> : null;
                    })()}
                    <div className={`answer-text ${selectedFalse}`}>Faux</div>

                    {showAnswer && !answer && question?.falseFormattedFeedback && (
                        <div className="false-feedback mb-2">
                            <div dangerouslySetInnerHTML={{ 
                                __html: (() => {
                                    try {
                                        return FormattedTextTemplate(question.falseFormattedFeedback);
                                    } catch (error) {
                                        console.error('Error formatting false feedback:', error);
                                        return question.falseFormattedFeedback.text || '';
                                    }
                                })()
                            }} />
                        </div>
                    )}
                </Button>
            </div>
            {question?.formattedGlobalFeedback && showAnswer && (
                <div className="global-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ 
                        __html: (() => {
                            try {
                                return FormattedTextTemplate(question.formattedGlobalFeedback);
                            } catch (error) {
                                console.error('Error formatting global feedback:', error);
                                return question.formattedGlobalFeedback.text || '';
                            }
                        })()
                    }} />
                </div>
            )}
            {!showAnswer && handleOnSubmitAnswer && (
                <Button
                    variant="contained"
                    onClick={() =>
                        answer !== undefined && handleOnSubmitAnswer?.([answer])
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
