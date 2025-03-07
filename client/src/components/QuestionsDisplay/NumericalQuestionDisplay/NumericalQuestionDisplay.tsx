// NumericalQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';

interface Props {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: string | number | boolean) => void;
    showAnswer?: boolean;
    passedAnswer?: string | number | boolean;
}

const NumericalQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } =
        props;
    const [answer, setAnswer] = useState<string | number | boolean>(passedAnswer || '');
    const correctAnswers = question.choices;
    let correctAnswer = '';

    useEffect(() => {
    if (passedAnswer !== null && passedAnswer !== undefined) {
        setAnswer(passedAnswer);
    }
    }, [passedAnswer]);
    
    //const isSingleAnswer = correctAnswers.length === 1;

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
    } else {
        throw new Error('Unknown numerical answer type');
    }

    return (
        <div className="question-wrapper">
            <div>
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-2">
                    <strong>La bonne réponse est: </strong>
                    {correctAnswer}</div>
                    <span>
                        <strong>Votre réponse est: </strong>{answer.toString()}
                    </span>
                    {question.formattedGlobalFeedback && <div className="global-feedback mb-2">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>}

                </>
            ) : (
                <>
                    <div className="answer-wrapper mb-1">
                        <TextField
                            type="number"
                            id={question.formattedStem.text}
                            name={question.formattedStem.text}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setAnswer(e.target.valueAsNumber);
                            }}
                            inputProps={{ 'data-testid': 'number-input' }}
                        />
                    </div>
                    {question.formattedGlobalFeedback && showAnswer && (
                        <div className="global-feedback mb-2">
                            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
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
                            disabled={answer === "" || isNaN(answer as number)}
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
