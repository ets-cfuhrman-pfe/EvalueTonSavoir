// TrueFalseQuestionDisplayV2.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import ProgressOverlay from '../ProgressOverlay/ProgressOverlay';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { StudentType } from 'src/Types/StudentType';
import { calculateAnswerStatistics, getAnswerPercentage, getAnswerCount, getTotalStudentsWhoAnswered } from 'src/utils/answerStatistics';

interface PropsV2 {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    students?: StudentType[];
    showStatistics?: boolean;
}

const TrueFalseQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, buttonText = 'Répondre', disabled = false, students = [], showStatistics = false } = props;

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
    // For teacher view (no handleOnSubmitAnswer), show validation when showAnswer is true
    // For student view, only show validation after they've submitted an answer
    const shouldShowValidation = showAnswer && (handleOnSubmitAnswer === undefined || answer !== undefined);
    const selectedTrue = answer === true ? 'selected' : '';
    const selectedFalse = answer === false ? 'selected' : '';

    // Compute class names for buttons
    const trueColorClass = shouldShowValidation && !showStatistics
        ? (question.isTrue ? 'bg-success text-white' : 'bg-danger text-white') 
        : shouldShowValidation && showStatistics
        ? 'bg-light text-dark'
        : (selectedTrue ? 'bg-primary text-white' : 'bg-light text-dark');
    const trueValidationClass = shouldShowValidation && selectedTrue ? 'choice-button-validated-selected' : '';

    const falseColorClass = shouldShowValidation && !showStatistics
        ? (!question.isTrue ? 'bg-success text-white' : 'bg-danger text-white') 
        : shouldShowValidation && showStatistics
        ? 'bg-light text-dark'
        : (selectedFalse ? 'bg-primary text-white' : 'bg-light text-dark');
    const falseValidationClass = shouldShowValidation && selectedFalse ? 'choice-button-validated-selected' : '';

    // Calculate answer statistics if we should show them
    const answerStatistics = showStatistics ? calculateAnswerStatistics(students, Number(question.id)) : {};
    const totalWhoAnswered = showStatistics ? getTotalStudentsWhoAnswered(students, Number(question.id)) : 0;

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
                            onClick={() => !shouldShowValidation && !disabled && handleOnClickAnswer(true)}
                            disabled={disableButton || disabled}
                            variant="outlined"
                        >
                            <ProgressOverlay 
                                percentage={getAnswerPercentage(answerStatistics, 'true')}
                                show={showStatistics}
                                colorClass={shouldShowValidation ? 
                                    (question.isTrue ? 'progress-overlay-correct' : 'progress-overlay-incorrect') : 
                                    'progress-overlay-default'
                                }
                            />
                            <div className="d-flex align-items-center choice-button-content">
                                <div className="flex-grow-1">
                                    <strong>Vrai</strong>
                                </div>
                                {showStatistics && (
                                    <div className="ms-auto d-flex align-items-center gap-2 px-2 choice-button-content">
                                        <span className="stats-badge">
                                            {getAnswerPercentage(answerStatistics, 'true')}%
                                        </span>
                                        <span className="stats-fraction text-muted">
                                            ({getAnswerCount(answerStatistics, 'true')}/{totalWhoAnswered})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Button>
                        {showAnswer && answer && question.trueFormattedFeedback && (
                            <div className="true-feedback">
                                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.trueFormattedFeedback) }} />
                            </div>
                        )}
                    </div>
                    
                    <div className="col-md-6">
                        <Button
                            className={`w-100 p-3 text-start choice-button ${falseColorClass} ${falseValidationClass}`}
                            onClick={() => !shouldShowValidation && !disabled && handleOnClickAnswer(false)}
                            disabled={disableButton || disabled}
                            variant="outlined"
                        >
                            <ProgressOverlay 
                                percentage={getAnswerPercentage(answerStatistics, 'false')}
                                show={showStatistics}
                                colorClass={shouldShowValidation ? 
                                    (!question.isTrue ? 'progress-overlay-correct' : 'progress-overlay-incorrect') : 
                                    'progress-overlay-default'
                                }
                            />
                            <div className="d-flex align-items-center choice-button-content">
                                <div className="flex-grow-1">
                                    <strong>Faux</strong>
                                </div>
                                {showStatistics && (
                                    <div className="ms-auto d-flex align-items-center gap-2 px-2 choice-button-content">
                                        <span className="stats-badge">
                                            {getAnswerPercentage(answerStatistics, 'false')}%
                                        </span>
                                        <span className="stats-fraction text-muted">
                                            ({getAnswerCount(answerStatistics, 'false')}/{totalWhoAnswered})
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Button>
                        {showAnswer && !answer && question.falseFormattedFeedback && (
                            <div className="false-feedback">
                                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.falseFormattedFeedback) }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Submit button */}
            {(!showAnswer || buttonText === 'Voir les résultats') && handleOnSubmitAnswer && (
                <div className="d-grid gap-2 mb-4">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() =>
                            answer !== undefined && handleOnSubmitAnswer?.([answer])
                        }
                        disabled={buttonText !== 'Voir les résultats' && answer === undefined}
                        className="btn-primary"
                    >
                        {buttonText}
                    </Button>
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column">
                {question.formattedGlobalFeedback && showAnswer && (
                    <div className="global-feedback">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrueFalseQuestionDisplayV2;