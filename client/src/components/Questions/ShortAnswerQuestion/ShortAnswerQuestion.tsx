// ShortAnswerQuestion.tsx
import React, { useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { TextFormat } from '../../GiftTemplate/templates/types';
import textType, { formatLatex } from '../../GiftTemplate/templates/TextType';
import DOMPurify from 'dompurify';

type Choices = {
    feedback: { format: string; text: string } | null;
    isCorrect: boolean;
    text: { format: string; text: string };
    weigth?: number;
    id: string;
};

interface Props {
    questionContent: TextFormat;
    choices: Choices[];
    globalFeedback?: string | undefined;
    handleOnSubmitAnswer?: (answer: string) => void;
    showAnswer?: boolean;
}

const ShortAnswerQuestion: React.FC<Props> = (props) => {
    const { questionContent, choices, showAnswer, handleOnSubmitAnswer, globalFeedback } = props;
    const [answer, setAnswer] = useState<string>();

    return (
        <div className="question-wrapper">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textType({text: questionContent})) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-1">
                        {choices.map((choice) => (
                            <div key={choice.id} className="mb-1">
                                {choice.text.text}
                            </div>
                        ))}
                    </div>
                    {globalFeedback && <div className="global-feedback mb-2"dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatLatex(globalFeedback))}}></div>}
                </>
            ) : (
                <>
                    <div className="answer-wrapper mb-1">
                        <TextField
                            type="text"
                            id={questionContent.text}
                            name={questionContent.text}
                            onChange={(e) => {
                                setAnswer(e.target.value);
                            }}
                            disabled={showAnswer}
                            inputProps={{ 'data-testid': 'text-input' }}
                        />
                    </div>
                    {handleOnSubmitAnswer && (
                        <Button
                            variant="contained"
                            onClick={() =>
                                answer !== undefined &&
                                handleOnSubmitAnswer &&
                                handleOnSubmitAnswer(answer)
                            }
                            disabled={answer === undefined || answer === ''}
                        >
                            Répondre
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default ShortAnswerQuestion;
