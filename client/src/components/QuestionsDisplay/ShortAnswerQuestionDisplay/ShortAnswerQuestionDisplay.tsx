import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: ShortAnswerQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;

}

const ShortAnswerQuestionDisplay: React.FC<Props> = (props) => {

    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || []);
    
    useEffect(() => {
    if (passedAnswer !== undefined) {
        setAnswer(passedAnswer);
    }
    }, [passedAnswer]);
    console.log("Answer" , answer);

    return (
        <div className="question-wrapper">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-1">
                    <span>
                        <strong>La bonne réponse est: </strong>
                    
                        {question.choices.map((choice) => (
                            <div key={choice.text} className="mb-1">
                                {choice.text}
                            </div>
                        ))}
                    </span>
                    <span>
                        <strong>Votre réponse est: </strong>{answer}
                    </span>
                    </div>
                    {question.formattedGlobalFeedback && <div className="global-feedback mb-2">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                    </div>}
                </>
            ) : (
                <>
                    <div className="answer-wrapper mb-1">
                        <TextField
                            type="text"
                            id={question.formattedStem.text}
                            name={question.formattedStem.text}
                            onChange={(e) => {
                                setAnswer([e.target.value]);
                            }}
                            disabled={showAnswer}
                            aria-label="short-answer-input"
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
                            disabled={answer === null || answer === undefined || answer.length === 0}
                        >
                            Répondre
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default ShortAnswerQuestionDisplay;
