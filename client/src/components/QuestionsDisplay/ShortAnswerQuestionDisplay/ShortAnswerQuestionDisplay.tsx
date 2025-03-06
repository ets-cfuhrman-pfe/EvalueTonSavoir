import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { StudentType } from 'src/Types/StudentType';

interface Props {
    question: ShortAnswerQuestion;
    handleOnSubmitAnswer?: (answer: string) => void;
    showAnswer?: boolean;
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const ShortAnswerQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, isDisplayOnly } = props;
    const [answer, setAnswer] = useState<string>();
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);
    const [correctAnswerRate, setCorrectAnswerRate] = useState<number>(0);

    const toggleShowCorrectAnswers = () => {
        setShowCorrectAnswers(!showCorrectAnswers);
    };

    useEffect(() => {
        if (showCorrectAnswers && students) {
            calculateCorrectAnswerRate();
        }
    }, [showCorrectAnswers, students]);

    const calculateCorrectAnswerRate = () => {
        if (!students || students.length === 0) {
            setCorrectAnswerRate(0); // Safeguard against undefined or empty student array
            return;
        }

        const totalSubmissions = students.length;
        const correctSubmissions = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.isCorrect
            )
        ).length;
        setCorrectAnswerRate((correctSubmissions / totalSubmissions) * 100);
    };

    return (
        <div className="question-wrapper">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            {showAnswer ? (
                <>
                    <div className="correct-answer-text mb-1">
                        {question.choices.map((choice) => (
                            <div key={choice.text} className="mb-1">
                                {choice.text}
                            </div>
                        ))}
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
                            disabled={answer === undefined || answer === ''}
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
                            Taux de réponse correcte:
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

export default ShortAnswerQuestionDisplay;
