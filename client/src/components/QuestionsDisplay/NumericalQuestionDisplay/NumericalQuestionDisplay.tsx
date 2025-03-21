// NumericalQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleNumericalAnswer, NumericalQuestion } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
}

const NumericalQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer } =
        props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || '');
    const [isGoodAnswer, setisGoodAnswer] = useState<boolean>(false);
    let isMultpleAnswer = false;
    const correctAnswers = question.choices;
    const correctAnswersPhrases: string[] = [];
    let correctAnswer = '';


    useEffect(() => {
        if (passedAnswer !== null && passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    }, [passedAnswer]);

    useEffect(() => {
        checkAnswer();
    }, [answer]);

    const isValidWeight = (weight?: number) => weight === undefined || weight > 0;

    const isAnswerCorrect = (answer: number, correctAnswer: any): boolean => {
        if (isSimpleNumericalAnswer(correctAnswer)) {
            return answer === correctAnswer.number;
        } else if (isRangeNumericalAnswer(correctAnswer)) {
            return (
                answer >= correctAnswer.number - correctAnswer.range &&
                answer <= correctAnswer.number + correctAnswer.range
            );
        } else if (isHighLowNumericalAnswer(correctAnswer)) {
            return (
                answer >= correctAnswer.numberLow &&
                answer <= correctAnswer.numberHigh
            );
        }
        return false;
    };

    const formatCorrectAnswer = (correctAnswer: any): string => {
        if (isSimpleNumericalAnswer(correctAnswer)) {
            return `${correctAnswer.number}`;
        } else if (isRangeNumericalAnswer(correctAnswer)) {
            return `Entre ${correctAnswer.number - correctAnswer.range} et ${correctAnswer.number + correctAnswer.range}`;
        } else if (isHighLowNumericalAnswer(correctAnswer)) {
            return `Entre ${correctAnswer.numberLow} et ${correctAnswer.numberHigh}`;
        }
        return '';
    };

    const checkAnswer = () => {
        if (isMultpleAnswer) {
            correctAnswers.forEach((answers) => {
                if (
                    isMultipleNumericalAnswer(answers) &&
                    isValidWeight(answers.weight) &&
                    isAnswerCorrect(answer as number, answers.answer)
                ) {
                    setisGoodAnswer(true);
                }
            });
        } else {
            const firstAnswer = correctAnswers[0];
            if (isAnswerCorrect(answer as number, firstAnswer)) {
                setisGoodAnswer(true);
            }
        }
    };

    if (isMultipleNumericalAnswer(correctAnswers[0])) {
        correctAnswers.forEach((answers) => {
            if (
                isMultipleNumericalAnswer(answers) &&
                isValidWeight(answers.weight)
            ) {
                correctAnswersPhrases.push(formatCorrectAnswer(answers.answer));
            }
        });
        isMultpleAnswer = true;
    } else {
        correctAnswer = formatCorrectAnswer(correctAnswers[0]);
    }

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
                            {isMultpleAnswer ? (
                                correctAnswersPhrases.map((phrase) => (
                                    <div key={phrase} className="accepted-answers">
                                        {phrase}
                                    </div>
                                ))
                            ) : (
                                <div className="accepted-answers">{correctAnswer}</div>
                            )}
                        </div>
                        <div>
                            <div className="question-title">
                                Votre réponse est: </div>
                            <span>
                                <div className="accepted-answers">{answer}</div>
                                {isMultpleAnswer && (() => {
    const highestPriorityAnswer = correctAnswers.reduce((prev, current) => {
        const prevWeight = (prev as MultipleNumericalAnswer).weight ?? -1; // Treat undefined as highest priority
        const currentWeight = (current as MultipleNumericalAnswer).weight ?? -1; // Treat undefined as highest priority

        // Prioritize undefined weights, otherwise compare weights numerically
        if (prevWeight === -1 && currentWeight !== -1) return prev;
        if (currentWeight === -1 && prevWeight !== -1) return current;
        return currentWeight > prevWeight ? current : prev;
    });

                                    return isAnswerCorrect(answer as number, (highestPriorityAnswer as MultipleNumericalAnswer).answer) && (
                                        <div>
                                            {(highestPriorityAnswer as MultipleNumericalAnswer).formattedFeedback && (
                                                <div className="global-feedback">
                                                    <div
                                                        dangerouslySetInnerHTML={{
                                                            __html: FormattedTextTemplate(
                                                                (highestPriorityAnswer as MultipleNumericalAnswer).formattedFeedback!
                                                            ),
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </span>
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
                            type="number"
                            id={question.formattedStem.text}
                            name={question.formattedStem.text}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setAnswer(e.target.valueAsNumber);
                            }}
                            inputProps={{ 'data-testid': 'number-input' }}
                        />
                    </div>
                    {question.formattedGlobalFeedback && showAnswer && (
                        <div className="global-feedback mb-2">
                            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                        </div>
                    )}
                    {handleOnSubmitAnswer && (
                        <div className="submit-button-container">
                            <Button
                                className='submit-button'
                                variant="contained"
                                onClick={() =>
                                    answer !== undefined &&
                                    handleOnSubmitAnswer &&
                                    handleOnSubmitAnswer(answer)
                                }
                                disabled={answer === "" || isNaN(answer as number)}
                            >
                                Répondre
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NumericalQuestionDisplay;
