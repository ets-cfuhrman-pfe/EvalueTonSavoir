// NumericalQuestion.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
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
    const correctAnswers = question.choices;
    let correctAnswer = '';

    useEffect(() => {
    if (passedAnswer !== null && passedAnswer !== undefined) {
        setAnswer(passedAnswer);
    }
    }, [passedAnswer]);
    
    useEffect(() => {
        checkAnswer();
    }, [answer]);

    const checkAnswer = () => {
        const isCorrect = correctAnswer === answer;
        setisGoodAnswer(isCorrect);
    };
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
                                <div className="accepted-answers">
                                    {correctAnswer}
                                </div>
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
                        <Button
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
                    )}
                </>
            )}
        </div>
    );
};

export default NumericalQuestionDisplay;
