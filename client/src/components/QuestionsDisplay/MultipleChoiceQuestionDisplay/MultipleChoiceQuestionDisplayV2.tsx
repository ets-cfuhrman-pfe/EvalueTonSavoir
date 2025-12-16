// MultipleChoiceQuestionDisplayV2.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import ProgressOverlay from '../ProgressOverlay/ProgressOverlay';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { Student } from 'src/Types/StudentType';
import { calculateAnswerStatistics, getAnswerPercentage, getAnswerCount, getTotalStudentsWhoAnswered } from 'src/utils/answerStatistics';

interface PropsV2 {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    students?: Student[];
    showStatistics?: boolean;
    hideAnswerFeedback?: boolean;
    showCorrectnessBanner?: boolean;
}

const MultipleChoiceQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, buttonText = 'Répondre', disabled = false, students = [], showStatistics = false, hideAnswerFeedback = false, showCorrectnessBanner = true } = props;
    // console.log('MultipleChoiceQuestionDisplayV2: passedAnswer', JSON.stringify(passedAnswer));

    const [answer, setAnswer] = useState<AnswerType>(() => {
        if (passedAnswer && passedAnswer.length > 0) {
            return passedAnswer;
        }
        return [];
    });

    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        // console.log('MultipleChoiceQuestionDisplayV2: passedAnswer', JSON.stringify(passedAnswer));
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        } else {
            setAnswer([]);
        }
    }, [passedAnswer, question.id]);

    // Prevent validation styling from showing immediately on question change
    // For teacher view (no handleOnSubmitAnswer), show validation when showAnswer is true
    // For student view, only show validation after they've submitted an answer
    const shouldShowValidation = showAnswer && (handleOnSubmitAnswer === undefined || answer.length > 0);

    // Determine overall correctness of the submitted answer for an immediate visual cue
    const isUserAnswerCorrect = useMemo(() => {
        if (!shouldShowValidation) return undefined;
        const correctChoices = question.choices.filter((c) => c.isCorrect).map((c) => c.formattedText.text);
        if (correctChoices.length !== answer.length) return false;
        const correctSet = new Set(correctChoices);
        return answer.every((choice) => correctSet.has(String(choice)));
    }, [answer, question.choices, shouldShowValidation]);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer((prevAnswer) => {
            // console.log(`handleOnClickAnswer -- setAnswer(): prevAnswer: ${prevAnswer}, choice: ${choice}`);
            const correctAnswersCount = question.choices.filter((c) => c.isCorrect).length;

            if (correctAnswersCount === 1) {
                // If only one correct answer, replace the current selection
                return prevAnswer.includes(choice) ? [] : [choice];
            } else {
                // Allow multiple selections if there are multiple correct answers
                if (prevAnswer.includes(choice)) {
                    // Remove the choice if it's already selected
                    return prevAnswer.filter((selected) => selected !== choice);
                } else {
                    // Add the choice if it's not already selected
                    return [...prevAnswer, choice];
                }
            }
        });
    };

    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));

    // Calculate answer statistics if we should show them
    const answerStatistics = showStatistics ? calculateAnswerStatistics(students, Number(question.id)) : {};
    const totalWhoAnswered = showStatistics ? getTotalStudentsWhoAnswered(students, Number(question.id)) : 0;

    return (
        <div className="quiz-question-area">
            {/* Overall correctness banner */}
            {shouldShowValidation && showCorrectnessBanner && (
                <div
                    className={`alert d-flex align-items-center fw-bold mb-3 quiz-correctness-banner ${
                        isUserAnswerCorrect ? 'alert-success' : 'alert-danger'
                    }`}
                >
                    {isUserAnswerCorrect ? 'Réponse correcte' : 'Réponse incorrecte'}
                </div>
            )}

            {/* Question text */}
            <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>

            {/* Choices */}
            <div className="mb-4">
                {question.choices.map((choice, i) => {                    
                    const selected = answer.includes(choice.formattedText.text) ? 'selected' : '';
                    const isChoiceCorrect = choice.isCorrect;

                    let buttonStateClass = '';
                    if (shouldShowValidation && !showStatistics) {
                        buttonStateClass = isChoiceCorrect ? 'bg-success text-white' : 'bg-danger text-white';
                    } else if (shouldShowValidation && showStatistics) {
                        // When showing both validation and statistics, use neutral background
                        buttonStateClass = 'bg-light text-dark';
                    } else {
                        buttonStateClass = selected ? 'bg-primary text-white choice-button-selected' : 'bg-light text-dark';
                    }

                    let letterStateClass = '';
                    if (shouldShowValidation && !showStatistics) {
                        letterStateClass = isChoiceCorrect ? 'bg-white text-success' : 'bg-white text-danger';
                    } else if (shouldShowValidation && showStatistics) {
                        // When showing both validation and statistics, use validation colors for letter
                        letterStateClass = isChoiceCorrect ? 'bg-white text-success' : 'bg-white text-danger';
                    } else {
                        letterStateClass = selected ? 'bg-white text-primary' : 'bg-white text-dark';
                    }

                    return (
                        <div key={choice.formattedText.text + i} className="mb-3">
                            <Button
                                variant="outlined"
                                className={`w-100 text-start justify-content-start p-3 choice-button ${buttonStateClass} ${
                                    shouldShowValidation && selected ? 'choice-button-validated-selected' : ''
                                }`}
                                 disabled={disableButton || disabled || (showAnswer && hideAnswerFeedback)}
                                onClick={() => !shouldShowValidation && !disabled && !(showAnswer && hideAnswerFeedback) && handleOnClickAnswer(choice.formattedText.text)}
                            >
                                <ProgressOverlay 
                                    percentage={getAnswerPercentage(answerStatistics, choice.formattedText.text)}
                                    show={showStatistics}
                                    colorClass={shouldShowValidation ? 
                                        (isChoiceCorrect ? 'progress-overlay-correct' : 'progress-overlay-incorrect') : 
                                        'progress-overlay-default'
                                    }
                                />
                                <div className="d-flex align-items-center w-100 choice-button-content">
                                    <div 
                                        className={`choice-letter d-flex align-items-center justify-content-center me-3 rounded-circle border ${letterStateClass}`}
                                    >
                                        {alphabet[i]}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: FormattedTextTemplate(choice.formattedText),
                                            }}
                                        />
                                    </div>
                                    {showStatistics && (
                                        <div className="ms-auto d-flex align-items-center choice-button-content">
                                            <span className="stats-badge">
                                                {getAnswerPercentage(answerStatistics, choice.formattedText.text)}%
                                            </span>
                                            <span className="stats-fraction px-2">
                                                {getAnswerCount(answerStatistics, choice.formattedText.text)}/{totalWhoAnswered}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Button>
                            {choice.formattedFeedback && showAnswer && !hideAnswerFeedback && (
                                <div className="mt-2">
                                    <div className="alert alert-info small">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: FormattedTextTemplate(choice.formattedFeedback),
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Submit button */}
            {(!showAnswer || buttonText === 'Voir les résultats') && handleOnSubmitAnswer && (
                <div className="d-grid gap-2 mb-4">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() =>
                            answer.length > 0 && handleOnSubmitAnswer?.(answer)
                        }
                        disabled={buttonText !== 'Voir les résultats' && answer.length === 0}
                        className="quiz-submit-btn"
                    >
                        {buttonText}
                    </Button>
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column">
                 {question.formattedGlobalFeedback && showAnswer && !hideAnswerFeedback && (
                    <div className="global-feedback">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: FormattedTextTemplate(question.formattedGlobalFeedback),
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultipleChoiceQuestionDisplayV2;