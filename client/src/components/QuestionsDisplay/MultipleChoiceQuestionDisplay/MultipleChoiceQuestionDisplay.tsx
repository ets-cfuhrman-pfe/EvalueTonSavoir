// MultipleChoiceQuestionDisplay.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
}

const MultipleChoiceQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || '');
    const [isGoodAnswer, setisGoodAnswer] = useState<boolean>(false);


    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    }, [passedAnswer]);

    useEffect(() => {
        checkAnswer();
    }, [answer]);

    const checkAnswer = () => {
        const isCorrect = question.choices.some((choice) => choice.formattedText.text === answer as string);
        setisGoodAnswer(isCorrect);
    };

    const handleOnClickAnswer = (choice: string) => {
        setAnswer(choice);
    };
    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));
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
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            <div className="choices-wrapper mb-1">

                {question.choices.map((choice, i) => {
                    const selected = answer === choice.formattedText.text ? 'selected' : '';
                    return (
                        <div key={choice.formattedText.text + i} className="choice-container">
                            <Button
                                variant="text"
                                className="button-wrapper"
                                disabled={disableButton}
                                onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}>
                                {showAnswer ? (<div> {(choice.isCorrect ? '✅' : '❌')}</div>)
                                    : ``}
                                <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                <div className={`answer-text ${selected}`}>
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(choice.formattedText) }} />
                                </div>
                                {choice.formattedFeedback && showAnswer && (
                                    <div className="feedback-container mb-1 mt-1/2">
                                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(choice.formattedFeedback) }} />
                                    </div>
                                )}
                            </Button>

                        </div>
                    );
                })}
            </div>
            {question.formattedGlobalFeedback && showAnswer && (
                <div className="global-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                </div>
            )}

            {!showAnswer && handleOnSubmitAnswer && (

                <Button
                    className='submit-button'
                    variant="contained"
                    onClick={() =>
                        answer !== "" && handleOnSubmitAnswer && handleOnSubmitAnswer(answer)
                    }
                    disabled={answer === '' || answer === null}
                >
                    Répondre

                </Button>
            )}
        </div>
    );
};

export default MultipleChoiceQuestionDisplay;
