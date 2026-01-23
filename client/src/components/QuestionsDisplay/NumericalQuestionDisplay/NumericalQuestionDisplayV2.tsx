// NumericalQuestionDisplayV2.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import ValidatedTextField from '../../ValidatedTextField/ValidatedTextField';

const noop = () => {};

interface PropsV2 {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    hideAnswerFeedback?: boolean;
}

const NumericalQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, buttonText = 'Répondre', disabled = false, hideAnswerFeedback = false } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || []);
    const correctAnswers = question.choices;
    let correctAnswer = '';

    useEffect(() => {
        if (passedAnswer !== null && passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    }, [passedAnswer]);

    if (isSimpleNumericalAnswer(correctAnswers[0])) {
        correctAnswer = `${(correctAnswers[0] as SimpleNumericalAnswer).number}`;
    } else if (isRangeNumericalAnswer(correctAnswers[0])) {
        const choice = correctAnswers[0] as RangeNumericalAnswer;
        correctAnswer = `Entre ${choice.number - choice.range} et ${choice.number + choice.range}`;
    } else if (isHighLowNumericalAnswer(correctAnswers[0])) {
        const choice = correctAnswers[0] as HighLowNumericalAnswer;
        correctAnswer = `Entre ${choice.numberLow} et ${choice.numberHigh}`;
    } else if (isMultipleNumericalAnswer(correctAnswers[0])) {
        correctAnswer = `MultipleNumericalAnswer is not supported yet`;
    }

    return (
        <div className="quiz-question-area">
            {/* Question text */}
            <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>

            {showAnswer && !hideAnswerFeedback ? (
                <div className="mb-4">
                    {answer && answer.length > 0 && answer[0] !== undefined && answer[0] !== null ? (
                        (() => {
                            const userAnswer = Number(answer[0]);
                            let isCorrect = false;

                            // Check against all provided numerical answers (simple, range, high/low)
                            correctAnswers.forEach((choice) => {
                                if (isCorrect) return;

                                if (isSimpleNumericalAnswer(choice)) {
                                    isCorrect = userAnswer === choice.number;
                                } else if (isRangeNumericalAnswer(choice)) {
                                    isCorrect = Math.abs(userAnswer - choice.number) <= choice.range;
                                } else if (isHighLowNumericalAnswer(choice)) {
                                    isCorrect = userAnswer >= choice.numberLow && userAnswer <= choice.numberHigh;
                                } else if (typeof (choice as any).number === 'number') {
                                    // Fallback for loosely shaped numerical answers
                                    isCorrect = userAnswer === (choice as any).number;
                                }
                            });
                            return (
                                <>
                                    <div className={`fw-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                    </div>
                                    <div className="mt-2">
                                        <strong>Question :</strong> <span dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                                    </div>
                                    <div className="mt-2">
                                        <strong>Bonne réponse :</strong> {correctAnswer}
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        // Teacher view - just show the correct answer
                        <div>
                            <div className="mt-2">
                                <strong>Bonne réponse :</strong> {correctAnswer}
                            </div>
                        </div>
                    )}
                </div>
            ) : showAnswer && hideAnswerFeedback ? (
                // Show the input field disabled when hideAnswerFeedback is true
                <div className="mb-4">
                    <div className="row">
                        <div className="col-md-8">
                            <ValidatedTextField
                                fieldPath="number.decimal"
                                initialValue={answer[0]?.toString() || ''}
                                onValueChange={noop} // No-op function since it's disabled
                                type="number"
                                id={question.formattedStem.text}
                                name={question.formattedStem.text}
                                disabled={true}
                                aria-label="number-input"
                                fullWidth
                                label="Votre réponse (nombre)"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-4">
                    <div className="row">
                        <div className="col-md-8">
                            <ValidatedTextField
                                fieldPath="number.decimal"
                                initialValue={answer[0]?.toString() || ''}
                                onValueChange={(value) => setAnswer([parseFloat(value) || 0])}
                                type="number"
                                id={question.formattedStem.text}
                                name={question.formattedStem.text}
                                disabled={showAnswer || disabled}
                                aria-label="number-input"
                                fullWidth
                                label="Votre réponse (nombre)"
                            />
                        </div>
                    </div>

                    {/* Submit button */}
                    {(!showAnswer || buttonText === 'Voir les résultats') && handleOnSubmitAnswer && (
                        <div className="d-grid gap-2 col-md-4 col-12 mt-4">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() =>
                                    answer !== undefined &&
                                    handleOnSubmitAnswer?.(answer)
                                }
                                disabled={buttonText !== 'Voir les résultats' && (answer === undefined || answer === null || isNaN(answer[0] as number))}
                                className="quiz-submit-btn"
                            >
                                {buttonText}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column" >
                {question.formattedGlobalFeedback && showAnswer && !hideAnswerFeedback && (
                    <div className="global-feedback">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NumericalQuestionDisplayV2;