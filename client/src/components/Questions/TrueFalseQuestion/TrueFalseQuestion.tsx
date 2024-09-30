// TrueFalseQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import textType from '../../GiftTemplate/templates/TextType';
import { TextFormat } from '../../GiftTemplate/templates/types';

interface Props {
    questionContent: TextFormat;
    correctAnswer: boolean;
    globalFeedback?: string | undefined;
    handleOnSubmitAnswer?: (answer: boolean) => void;
    showAnswer?: boolean;
}

const TrueFalseQuestion: React.FC<Props> = (props) => {
    const { questionContent, correctAnswer, showAnswer, handleOnSubmitAnswer, globalFeedback } =
        props;
    const [answer, setAnswer] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        setAnswer(undefined);
    }, [questionContent]);

    const selectedTrue = answer ? 'selected' : '';
    const selectedFalse = answer !== undefined && !answer ? 'selected' : '';
    return (
        <div className="question-container">
            <div className="question content">
            <div dangerouslySetInnerHTML={{ __html: textType({ text: questionContent }) }} />
            </div>
            <div className="choices-wrapper mb-1">
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && setAnswer(true)}
                    fullWidth
                >
                    {showAnswer && (correctAnswer ? '✅' : '❌')}
                    <div className={`circle ${selectedTrue}`}>V</div>
                    <div className={`answer-text ${selectedTrue}`}>Vrai</div>
                </Button>
                <Button
                    className="button-wrapper"
                    onClick={() => !showAnswer && setAnswer(false)}
                    fullWidth
                >
                    {showAnswer && (!correctAnswer ? '✅' : '❌')}
                    <div className={`circle ${selectedFalse}`}>F</div>
                    <div className={`answer-text ${selectedFalse}`}>Faux</div>
                </Button>
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

export default TrueFalseQuestion;
