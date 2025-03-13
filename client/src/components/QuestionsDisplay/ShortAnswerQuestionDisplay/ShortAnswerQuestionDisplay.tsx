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
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || '');
    const [isGoodAnswer, setisGoodAnswer] = useState<boolean>(false);


    useEffect(() => {
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    }, [passedAnswer]);

    useEffect(() => {
        checkAnswer();
    }, [answer]);

    const checkAnswer = () => {
        const isCorrect = question.choices.some((choice) => choice.text.toLowerCase() === (answer as String).toLowerCase());
        setisGoodAnswer(isCorrect);
    };

    return (

        <div className="question-wrapper">
            {showAnswer && (
                <div>
                    <div className='question-feedback-validation'>
                        {isGoodAnswer ? '✅ Correct! ' : '❌ Incorrect!'}
                    </div>
                    <div className="question-title">
                        Question :
                    </div>

                </div>
            )}
            <div>
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-1">
                        <div>
                            <div className="question-title">
                                Réponse(s) accepté(es):
                            </div>
                            {question.choices.map((choice) => (
                                <div key={choice.text} className="accepted-answers">
                                    {choice.text}
                                </div>
                            ))}
                        </div>
                        <div>
                            <div className="question-title">
                                Votre réponse est: </div>
                            <div className="accepted-answers">{answer}</div>
                        </div>
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
                                setAnswer(e.target.value);
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
                            disabled={answer === null || answer === ''}
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
