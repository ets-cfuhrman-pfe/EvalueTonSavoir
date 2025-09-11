// NumericalQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion } from 'gift-pegjs';
import { isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
}

const NumericalQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } =
        props;
    
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || []);
    
    useEffect(() => {
    if (passedAnswer !== null && passedAnswer !== undefined) {
        setAnswer(passedAnswer);
    }
    }, [passedAnswer]);
    
    // Early return if question is not available
    if (!question) {
        return <div>Question not available</div>;
    }
    
    const correctAnswers = question.choices || [];
    let correctAnswer = '';

    if (correctAnswers.length === 0) {
        // If no choices are provided, show a generic message for student mode
        correctAnswer = 'Réponse numérique attendue';
    } else {

    const firstChoice = correctAnswers[0] as any; // Use any to access type property

    if (firstChoice && typeof firstChoice === 'object' && firstChoice.type === 'simple') {
        correctAnswer = firstChoice.number !== undefined ? `${firstChoice.number}` : 'Réponse masquée';
    } else if (firstChoice && typeof firstChoice === 'object' && firstChoice.type === 'range') {
        if (firstChoice.number !== undefined && firstChoice.range !== undefined) {
            correctAnswer = `Entre ${firstChoice.number - firstChoice.range} et ${firstChoice.number + firstChoice.range}`;
        } else {
            correctAnswer = 'Réponse masquée';
        }
    } else if (firstChoice && typeof firstChoice === 'object' && firstChoice.type === 'high-low') {
        if (firstChoice.numberLow !== undefined && firstChoice.numberHigh !== undefined) {
            correctAnswer = `Entre ${firstChoice.numberLow} et ${firstChoice.numberHigh}`;
        } else {
            correctAnswer = 'Réponse masquée';
        }
    } else if (isMultipleNumericalAnswer(correctAnswers[0])) {
        correctAnswer = `MultipleNumericalAnswer is not supported yet`;
    } else {
        // Fallback: try to handle as simple numerical answer if it has a number property
        if (firstChoice && typeof firstChoice === 'object' && 'number' in firstChoice) {
            correctAnswer = firstChoice.number !== undefined ? `${firstChoice.number}` : 'Réponse masquée';
        } else {
            correctAnswer = 'MultipleNumericalAnswer is not supported yet';
        }
    }
    }

    return (
        <div className="question-wrapper">
            <div>
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
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-2">
                    <strong>La bonne réponse est: </strong>
                    {correctAnswer}</div>
                    <span>
                        <strong>Votre réponse est: </strong>{answer.toString()}
                    </span>
                    {question?.formattedGlobalFeedback && <div className="global-feedback mb-2">
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
                    </div>}

                </>
            ) : (
                <>
                    <div className="answer-wrapper mb-1">
                        <TextField
                            type="number"
                            id={question?.formattedStem?.text || 'numerical-answer'}
                            name={question?.formattedStem?.text || 'numerical-answer'}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setAnswer([e.target.valueAsNumber]);
                            }}
                            inputProps={{ 'data-testid': 'number-input' }}
                        />
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
                    {handleOnSubmitAnswer && (
                        <Button
                            variant="contained"
                            onClick={() =>
                                answer !== undefined &&
                                handleOnSubmitAnswer &&
                                handleOnSubmitAnswer(answer)
                            }
                            disabled={answer === undefined || answer === null || isNaN(answer[0] as number)}
                        >
                            Répondre
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default NumericalQuestionDisplay;
