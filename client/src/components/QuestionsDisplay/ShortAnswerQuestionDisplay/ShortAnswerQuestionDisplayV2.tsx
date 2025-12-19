// ShortAnswerQuestionDisplayV2.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import ValidatedTextField from '../../ValidatedTextField/ValidatedTextField';

const noop = () => {};

interface PropsV2 {
    question: ShortAnswerQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    hideAnswerFeedback?: boolean;
}

const ShortAnswerQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, buttonText = 'Répondre', disabled = false, hideAnswerFeedback = false } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || []);
    
    useEffect(() => {
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    }, [passedAnswer]);
    
    return (
        <div className="quiz-question-area">
            {/* Question text */}
            <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>

            {showAnswer && !hideAnswerFeedback ? (
                <div className="mb-4">
                    {answer && answer.length > 0 && answer[0] ? (
                        (() => {
                            const userAnswer = (answer[0] || '').toString().toLowerCase();
                            const isCorrect = question.choices.some(choice => choice.text.toLowerCase() === userAnswer);
                            return (
                                <>
                                    <div className={`fw-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
                                        {isCorrect ? 'Correct' : 'Incorrect'}
                                    </div>
                                    <div className="mt-2">
                                        <strong>Question :</strong> <span dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                                    </div>
                                    <div className="mt-2">
                                        <strong>Bonne réponse :</strong> {question.choices.map(choice => choice.text).join(', ')}
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        // Teacher view - just show the correct answer
                        <div>
                            <div className="mt-2">
                                <strong>Bonne réponse :</strong> {question.choices.map(choice => choice.text).join(', ')}
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
                                fieldPath="text.short"
                                initialValue={answer[0] || ''}
                                onValueChange={noop} // No-op function since it's disabled
                                type="text"
                                id={question.formattedStem.text}
                                name={question.formattedStem.text}
                                disabled={true}
                                aria-label="short-answer-input"
                                fullWidth
                                label="Votre réponse"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-4">
                    <div className="row">
                        <div className="col-md-8">
                            <ValidatedTextField
                                fieldPath="text.short"
                                initialValue={answer[0] || ''}
                                onValueChange={(value) => setAnswer([value])}
                                type="text"
                                id={question.formattedStem.text}
                                name={question.formattedStem.text}
                                disabled={showAnswer || disabled}
                                aria-label="short-answer-input"
                                fullWidth
                                label="Votre réponse"
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
                                    handleOnSubmitAnswer?.(answer)
                                }
                                disabled={buttonText !== 'Voir les résultats' && (!answer[0] || answer[0].toString().trim() === '')}
                                className="quiz-submit-btn"
                            >
                                {buttonText}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column">
                {question.formattedGlobalFeedback && showAnswer && !hideAnswerFeedback && (
                    <div className="global-feedback">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShortAnswerQuestionDisplayV2;