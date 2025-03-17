import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { StudentType } from 'src/Types/StudentType';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: ShortAnswerQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const ShortAnswerQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, passedAnswer, isDisplayOnly } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || '');
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
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        }
    
        if (showCorrectAnswers && students) {
            calculateCorrectAnswerRate();
        }
    
    }, [passedAnswer, showCorrectAnswers, students, answer]);
    console.log("Answer", answer);

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

    return (
            <><div className="container question-wrapper">
                <div className="row justify-content-center">
                    <div className="col-auto">
                    <div>
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
                                        setAnswer(e.target.value);
                                    } }
                                    disabled={showAnswer}
                                    aria-label="short-answer-input" />
                            </div>
                            {handleOnSubmitAnswer && (
                                <div className="col-auto d-flex flex-column align-items-center"> 
                                    <Button
                                        variant="contained"
                                        onClick={() => answer !== undefined &&
                                            handleOnSubmitAnswer &&
                                            handleOnSubmitAnswer(answer)}
                                        disabled={answer === null || answer === ''}
                                    >
                                        Répondre
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {isDisplayOnly && (
                    <>
                        <div className="col-auto d-flex flex-column align-items-center">                   
                            <Button
                                style={{ marginTop: '10px' }}
                                variant="outlined"
                                onClick={toggleShowCorrectAnswers}
                                color="primary"
                            >
                                {showCorrectAnswers ? "Masquer les résultats" : "Afficher les résultats"}
                            </Button>
                            {showCorrectAnswers && (
                                <div>
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
                            )}   
                        </div>
                    </>
                )}
            </div>
        </div></>
    );
};

export default ShortAnswerQuestionDisplay;
