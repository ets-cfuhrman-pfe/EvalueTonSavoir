// ShortAnswerQuestionDisplayV2.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import ValidatedTextField from '../../ValidatedTextField/ValidatedTextField';

interface PropsV2 {
    question: ShortAnswerQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    disabled?: boolean;
}

const ShortAnswerQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, disabled = false } = props;
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

            {showAnswer ? (
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
                    {handleOnSubmitAnswer && (
                        <div className="d-grid gap-2 mb-4 mt-4">
                            <Button
                                variant="contained"
                                size="large"
                                onClick={() =>
                                    handleOnSubmitAnswer?.(answer)
                                }
                                disabled={!answer[0] || answer[0].toString().trim() === '' || disabled}
                                className="btn-primary"
                            >
                                Répondre
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column" style={{minHeight: '5rem'}}>
                {question.formattedGlobalFeedback && showAnswer && (
                    <div className="global-feedback">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShortAnswerQuestionDisplayV2;