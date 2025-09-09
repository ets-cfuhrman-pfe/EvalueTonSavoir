// MultipleChoiceQuestionDisplay.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { AnswerType, AnswerValidationResult } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    answerValidation?: AnswerValidationResult;
}

const MultipleChoiceQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, answerValidation } = props;
    console.log('MultipleChoiceQuestionDisplay: passedAnswer', JSON.stringify(passedAnswer));

    const [answer, setAnswer] = useState<AnswerType>(() => {
        if (passedAnswer && passedAnswer.length > 0) {
            return passedAnswer;
        }
        return [];
    });

    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        console.log('MultipleChoiceQuestionDisplay: passedAnswer', JSON.stringify(passedAnswer));
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        } else {
            setAnswer([]);
        }
    }, [passedAnswer, question.id]);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer((prevAnswer) => {
            console.log(`handleOnClickAnswer -- setAnswer(): prevAnswer: ${prevAnswer}, choice: ${choice}`);
            const correctAnswersCount = question.choices.filter((c) => c.isCorrect).length;

            if (correctAnswersCount === 1) {
                // If only one correct answer, replace the current selection
                return prevAnswer.includes(choice) ? [] : [choice];
            } else if (prevAnswer.includes(choice)) {
                // Remove the choice if it's already selected
                return prevAnswer.filter((selected) => selected !== choice);
            } else {
                // Add the choice if it's not already selected
                return [...prevAnswer, choice];
            }
        });
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
                    console.log(`answer: ${answer}, choice: ${choice.formattedText.text}`);
                    const selected = answer.includes(choice.formattedText.text) ? 'selected' : '';
                    return (
                        <div key={choice.formattedText.text + i} className="choice-container">
                            <Button
                                variant="text"
                                className="button-wrapper"
                                disabled={disableButton}
                                onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}
                            >
                                {showAnswer && answerValidation && answer.includes(choice.formattedText.text) ? (
                                    <div>{answerValidation.isCorrect ? '✅' : '❌'}</div>
                                ) : (
                                    ''
                                )}
                                <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                <div className={`answer-text ${selected}`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: FormattedTextTemplate(choice.formattedText),
                                        }}
                                    />
                                </div>
                                {choice.formattedFeedback && showAnswer && (
                                    <div className="feedback-container mb-1 mt-1/2">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: FormattedTextTemplate(choice.formattedFeedback),
                                            }}
                                        />
                                    </div>
                                )}
                            </Button>
                        </div>
                    );
                })}
            </div>
            {question.formattedGlobalFeedback && showAnswer && (
                <div className="global-feedback mb-2">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: FormattedTextTemplate(question.formattedGlobalFeedback),
                        }}
                    />
                </div>
            )}
            {!showAnswer && handleOnSubmitAnswer && (
                <Button
                    variant="contained"
                    onClick={() =>
                        answer.length > 0 && handleOnSubmitAnswer?.(answer)
                    }
                    disabled={answer.length === 0}
                >
                    Répondre
                </Button>
            )}
        </div>
    );
};

export default MultipleChoiceQuestionDisplay;
