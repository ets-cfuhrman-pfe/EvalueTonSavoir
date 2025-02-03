// MultipleChoiceQuestionDisplay.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';

interface Props {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: string) => void;
    showAnswer?: boolean;
}

const MultipleChoiceQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer } = props;
    const [answer, setAnswer] = useState<string>();
    
    useEffect(() => {
        setAnswer(undefined);
    }, [question]);

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
                                onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}>
                                {showAnswer? (<div> {(choice.isCorrect ? '✅' : '❌')}</div>)
                                :``}
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

export default MultipleChoiceQuestionDisplay;
