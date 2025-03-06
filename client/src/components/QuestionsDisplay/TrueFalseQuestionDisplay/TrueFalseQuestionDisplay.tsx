// TrueFalseQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { StudentType } from 'src/Types/StudentType';

interface Props {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: boolean) => void;
    showAnswer?: boolean;
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const TrueFalseQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, isDisplayOnly } = props;
    const [answer, setAnswer] = useState<boolean | undefined>(undefined);
    const [pickRates, setPickRates] = useState<{ trueRate: number, falseRate: number }>({ trueRate: 0, falseRate: 0 });
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    useEffect(() => {
        setAnswer(undefined);
        calculatePickRates();
    }, [question, students]);

    const selectedTrue = answer ? 'selected' : '';
    const selectedFalse = answer !== undefined && !answer ? 'selected' : '';

    const toggleShowCorrectAnswers = () => {
        setShowCorrectAnswers(!showCorrectAnswers);
    };

    // Calcul le pick rate de chaque réponse
    const calculatePickRates = () => {
        if (!students) {
            setPickRates({ trueRate: 0, falseRate: 0 });
            return;
        }
    
        const totalAnswers = students.length;
    
        const trueAnswers = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.answer === true
            )).length;
    
        const falseAnswers = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.answer === false
            )).length;
    
        if (totalAnswers > 0) {
            setPickRates({
                trueRate: (trueAnswers / totalAnswers) * 100,
                falseRate: (falseAnswers / totalAnswers) * 100
            });
        } else {
            setPickRates({ trueRate: 0, falseRate: 0 });
        }
    };

    return (
        <div className="question-container">
            <div className="question content">
            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            <div className="choices-wrapper mb-1">
                <Button
                    className={`button-wrapper ${selectedTrue}`}
                    onClick={() => !showCorrectAnswers && setAnswer(true)}
                    fullWidth
                >
                    <div className={`circle ${selectedTrue}`}>V</div>
                    <div
                        className={`answer-text ${selectedTrue}`}
                        style={showCorrectAnswers ? {
                            backgroundImage: `linear-gradient(to right, ${question.isTrue ? 'lightgreen' : 'lightcoral'} ${pickRates.trueRate}%, transparent ${pickRates.trueRate}%)`
                        } : {}}
                    >
                        Vrai
                    </div>
                    {showCorrectAnswers && <div>{question.isTrue ? '✅' : '❌'}</div>}
                    {showCorrectAnswers && (
                        <div className="pick-rate">{pickRates.trueRate.toFixed(1)}%</div>
                    )}
                </Button>
                <Button
                    className={`button-wrapper ${selectedFalse}`}
                    onClick={() => !showCorrectAnswers && setAnswer(false)}
                    fullWidth
                >
                    <div className={`circle ${selectedFalse}`}>F</div>
                    <div
                        className={`answer-text ${selectedFalse}`}
                        style={showCorrectAnswers ? {
                            backgroundImage: `linear-gradient(to right, ${!question.isTrue ? 'lightgreen' : 'lightcoral'} ${pickRates.falseRate}%, transparent ${pickRates.falseRate}%)`,
                        } : {}}
                    >
                        Faux
                    </div>
                    {showCorrectAnswers && <div>{!question.isTrue ? '✅' : '❌'}</div>}
                    {showCorrectAnswers && (
                        <div className="pick-rate">{pickRates.falseRate.toFixed(1)}%</div>
                    )}
                </Button>


            </div>
            {/* selected TRUE, show True feedback if it exists */}
            {showAnswer && answer && question.trueFormattedFeedback && (
                <div className="true-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.trueFormattedFeedback) }} />
                </div>
            )}
            {/* selected FALSE, show False feedback if it exists */}
            {showAnswer && !answer && question.falseFormattedFeedback && (
                <div className="false-feedback mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.falseFormattedFeedback) }} />
                </div>
            )}
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

            {isDisplayOnly && (
                <div>
                    <Button
                    variant="outlined"
                    onClick={toggleShowCorrectAnswers}
                    color="primary"
                >
                    {showCorrectAnswers ? "Masquer les résultats" : "Afficher les résultats"}
                </Button>
                </div>
            )}
        </div>
    );
};

export default TrueFalseQuestionDisplay;
