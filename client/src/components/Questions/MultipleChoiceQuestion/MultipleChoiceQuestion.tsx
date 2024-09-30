// MultipleChoiceQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import textType, { formatLatex } from '../../GiftTemplate/templates/TextType';
import { TextFormat } from '../../GiftTemplate/templates/types';
// import Latex from 'react-latex';

type Choices = {
    feedback: { format: string; text: string } | null;
    isCorrect: boolean;
    text: { format: string; text: string };
    weigth?: number;
};

interface Props {
    questionStem: TextFormat;
    choices: Choices[];
    globalFeedback?: string | undefined;
    handleOnSubmitAnswer?: (answer: string) => void;
    showAnswer?: boolean;
}

const MultipleChoiceQuestion: React.FC<Props> = (props) => {
    const { questionStem: questionContent, choices, showAnswer, handleOnSubmitAnswer, globalFeedback } = props;
    const [answer, setAnswer] = useState<string>();

    useEffect(() => {
        setAnswer(undefined);
    }, [questionContent]);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer(choice);
    };


    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));
    return (
        <div className="question-container">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: textType({text: questionContent}) }} />
            </div>
            <div className="choices-wrapper mb-1">
                {choices.map((choice, i) => {
                    const selected = answer === choice.text.text ? 'selected' : '';
                    return (
                        <div key={choice.text.text + i} className="choice-container">
                                <Button
                                variant="text"
                                className="button-wrapper"
                                onClick={() => !showAnswer && handleOnClickAnswer(choice.text.text)}
                            >
                                {choice.feedback === null &&
                                    showAnswer &&
                                    (choice.isCorrect ? '✅' : '❌')}
                                <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                <div className={`answer-text ${selected}`}>
                                    {formatLatex(choice.text.text)}
                                </div>
                            </Button>
                            {choice.feedback && showAnswer && (
                                <div className="feedback-container mb-1 mt-1/2">
                                    {choice.isCorrect ? '✅' : '❌'}
                                    {choice.feedback?.text}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {globalFeedback && showAnswer && (
                <div className="global-feedback mb-2">{globalFeedback}</div>
            )}
            {!showAnswer && handleOnSubmitAnswer && (
                <Button
                    variant="contained"
                    onClick={() =>
                        answer !== undefined && handleOnSubmitAnswer && handleOnSubmitAnswer(answer)
                    }
                    disabled={answer === undefined}
                >
                    Répondre
                </Button>
            )}
        </div>
    );
};

export default MultipleChoiceQuestion;
