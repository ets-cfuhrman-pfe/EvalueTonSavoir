// NumericalQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';
import { QuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

const NumericalQuestionDisplay: React.FC = () => {
    const { questions, index, answers , submitAnswer } = useQuizContext();

    const question = questions[Number(index)].question as NumericalQuestion;
    const answer = answers[Number(index)]?.answer;

    const [actualAnswer, setActualAnswer] = useState<AnswerType>(answer || []);
    const correctAnswers = question.choices;
    let correctAnswer = '';

    useEffect(() => {
        if (answer !== null && answer !== undefined) {
            setActualAnswer(answer);
        }
    }, [answer]);

    //const isSingleAnswer = correctAnswers.length === 1;

    if (isSimpleNumericalAnswer(correctAnswers[0])) {
        correctAnswer = `${(correctAnswers[0] as SimpleNumericalAnswer).number}`;
    } else if (isRangeNumericalAnswer(correctAnswers[0])) {
        const choice = correctAnswers[0] as RangeNumericalAnswer;
        correctAnswer = `Entre ${choice.number - choice.range} et ${choice.number + choice.range}`;
    } else if (isHighLowNumericalAnswer(correctAnswers[0])) {
        const choice = correctAnswers[0] as HighLowNumericalAnswer;
        correctAnswer = `Entre ${choice.numberLow} et ${choice.numberHigh}`;
    } else if (isMultipleNumericalAnswer(correctAnswers[0])) {
        correctAnswer = `MultipleNumericalAnswer is not supported yet`;
    } else {
        throw new Error('Unknown numerical answer type');
    }

    return (
        <QuizContext.Consumer>
            {({ showAnswer }) => (
                <div className="question-wrapper">
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                    </div>
                    {showAnswer ? (
                        <>
                            <div className="correct-answer-text mb-2">
                                <strong>La bonne réponse est: </strong>
                                {correctAnswer}</div>
                            <span>
                                <strong>Votre réponse est: </strong>{actualAnswer.toString()}
                            </span>
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
                                        setActualAnswer([e.target.valueAsNumber]);
                                    }}
                                    inputProps={{ 'data-testid': 'number-input' }}
                                />
                            </div>
                            {question.formattedGlobalFeedback && showAnswer && (
                                <div className="global-feedback mb-2">
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedGlobalFeedback) }} />
                                </div>
                            )}
                            {submitAnswer && (
                                <Button
                                    variant="contained"
                                    onClick={() =>
                                        actualAnswer !== undefined &&
                                        submitAnswer &&
                                        submitAnswer(actualAnswer)
                                    }
                                    disabled={actualAnswer === undefined || actualAnswer === null || isNaN(actualAnswer[0] as number)}
                                >
                                    Répondre
                                </Button>
                            )}
                        </>
                    )}

                </div>
            )}
        </QuizContext.Consumer>
    );
};

export default NumericalQuestionDisplay;
