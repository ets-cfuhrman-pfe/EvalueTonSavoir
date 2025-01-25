// NumericalQuestion.tsx
import React, { useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import textType, { formatLatex } from '../../GiftTemplate/templates/TextType';
import { TextFormat } from '../../GiftTemplate/templates/types';
import DOMPurify from 'dompurify';

type CorrectAnswer = {
    numberHigh?: number;
    numberLow?: number;
    number?: number;
    type: string;
};

interface Props {
    questionContent: TextFormat;
    correctAnswers: CorrectAnswer;
    globalFeedback?: string | undefined;
    handleOnSubmitAnswer?: (answer: number) => void;
    showAnswer?: boolean;
}

const NumericalQuestion: React.FC<Props> = (props) => {
    const { questionContent, correctAnswers, showAnswer, handleOnSubmitAnswer, globalFeedback } =
        props;

    const [answer, setAnswer] = useState<number>();

    const correctAnswer =
        correctAnswers.type === 'high-low'
            ? `Entre ${correctAnswers.numberLow} et ${correctAnswers.numberHigh}`
            : correctAnswers.number;

    return (
        <div className="question-wrapper">
            <div>
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textType({text: questionContent})) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-2">{correctAnswer}</div>
                    {globalFeedback && <div className="global-feedback mb-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLatex(globalFeedback))}}></div>}
                </>
            ) : (
                <>
                    <div className="answer-wrapper mb-1">
                        <TextField
                            type="number"
                            id={questionContent.text}
                            name={questionContent.text}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setAnswer(e.target.valueAsNumber);
                            }}
                            inputProps={{ 'data-testid': 'number-input' }}
                        />
                    </div>
                    {globalFeedback && showAnswer && (
                        <div className="global-feedback mb-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLatex(globalFeedback))}}></div>
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

export default NumericalQuestion;
