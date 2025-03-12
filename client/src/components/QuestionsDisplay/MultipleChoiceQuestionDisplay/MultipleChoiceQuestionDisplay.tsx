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

    let disableButton = false;
    if(handleOnSubmitAnswer === undefined){
        disableButton = true;
    }

    useEffect(() => {
    if (passedAnswer !== undefined) {
        setAnswer(passedAnswer);
    }
    }, [passedAnswer]);

    useEffect(() => {
        const buttonWrapper = document.querySelector('.button-wrapper') as HTMLElement;
        if (buttonWrapper) {
            const buttonWrapperWidth = buttonWrapper.offsetWidth;
            document.documentElement.style.setProperty('--button-wrapper-width', `${buttonWrapperWidth}px`);
        }
    }, [question.choices, answer, showAnswer]);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer(choice);
    };
    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));
    return (

        <div className="question-container">
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
                                onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}>                                {showAnswer? (<div> {(choice.isCorrect ? '✅' : '❌')}</div>)
                                :``}
                                <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                <div className={`answer-text ${selected}`}>
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(choice.formattedText) }} />
                                </div>
                                {choice.formattedFeedback && showAnswer && (
                                <div className="feedback-container">
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
