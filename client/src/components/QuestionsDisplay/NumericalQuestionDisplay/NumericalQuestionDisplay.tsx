// NumericalQuestion.tsx
import React, { useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';

interface Props {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: number) => void;
    showAnswer?: boolean;
    isTeacher?: boolean;
}

const NumericalQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, isTeacher } =
        props;

    const [answer, setAnswer] = useState<number>();

    const correctAnswers = question.choices;
    let correctAnswer = '';

    const cleanHtml = (html: string): string => {
        if (isTeacher) {
            return html.replace(/<details>.*?<\/details>/gs, '');
        }
        return html;
    };
    const getCleanStem = (): string => {
        const rawHtml = FormattedTextTemplate(question.formattedStem);
        return cleanHtml(rawHtml);
    };

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
                <div dangerouslySetInnerHTML={{ __html: getCleanStem() }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-2">{correctAnswer}</div>
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
                            disabled={answer === undefined || isNaN(answer)}
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
