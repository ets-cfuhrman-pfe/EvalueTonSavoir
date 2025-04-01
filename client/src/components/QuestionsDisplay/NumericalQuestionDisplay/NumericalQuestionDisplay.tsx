// NumericalQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { NumericalQuestion, SimpleNumericalAnswer, RangeNumericalAnswer, HighLowNumericalAnswer } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer, isMultipleNumericalAnswer } from 'gift-pegjs/typeGuards';
import { StudentType } from 'src/Types/StudentType';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: NumericalQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;    
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const NumericalQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, passedAnswer, isDisplayOnly } =
        props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || []);
    const correctAnswers = question.choices;
    let correctAnswer = '';

    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
    const [correctAnswerRate, setCorrectAnswerRate] = useState<number>(0);
    const [submissionCounts, setSubmissionCounts] = useState({
        correctSubmissions: 0,
        totalSubmissions: 0
    });

    const toggleShowCorrectAnswers = () => {
        setShowCorrectAnswers(!showCorrectAnswers);
    };

    useEffect(() => {
        if (passedAnswer !== null && passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
        if (showCorrectAnswers && students) {
            calculateCorrectAnswerRate();
        }
    }, [passedAnswer, showCorrectAnswers, students]);

    const calculateCorrectAnswerRate = () => {
        if (!students || students.length === 0) {
            setSubmissionCounts({ correctSubmissions: 0, totalSubmissions: 0 });
            return;
        }

        const totalSubmissions = students.length;
        const correctSubmissions = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.isCorrect
            )
        ).length;
        
        setSubmissionCounts({
            correctSubmissions,
            totalSubmissions
        });

        setCorrectAnswerRate((correctSubmissions / totalSubmissions) * 100);
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
            <div>
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-2">
                    <strong>La bonne réponse est: </strong>
                    {correctAnswer}</div>
                    <span>
                        <strong>Votre réponse est: </strong>{answer.toString()}
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
                                setAnswer([e.target.valueAsNumber]);
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
                            disabled={answer === undefined || answer === null || isNaN(answer[0] as number)}
                        >
                            Répondre
                        </Button>
                    )}
                </>
            )}

            
            {isDisplayOnly && (
                <>
                    <div style={{ marginTop: '10px' }}>
                        <Button
                            variant="outlined"
                            onClick={toggleShowCorrectAnswers}
                            color="primary"
                        >
                            {showCorrectAnswers ? "Masquer les résultats" : "Afficher les résultats"}
                        </Button>
                    </div>
                    <div style={{
                        visibility: showCorrectAnswers ? 'visible' : 'hidden'
                    }}>
                        <div>
                            Taux de réponse correcte: {submissionCounts.correctSubmissions}/{submissionCounts.totalSubmissions}
                        </div>
                        <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${correctAnswerRate}%` }}></div>
                            <div className="progress-bar-text">
                                {correctAnswerRate.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NumericalQuestionDisplay;
