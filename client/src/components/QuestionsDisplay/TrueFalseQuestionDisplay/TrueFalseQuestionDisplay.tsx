// TrueFalseQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { StudentType } from 'src/Types/StudentType';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: TrueFalseQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;    
    students?: StudentType[];
    showResults?: boolean;
}

const TrueFalseQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, passedAnswer, showResults } = props;
    const [pickRates, setPickRates] = useState<{ trueRate: number, falseRate: number, trueCount: number, falseCount: number, totalCount: number }>({ 
        trueRate: 0, 
        falseRate: 0, 
        trueCount: 0, 
        falseCount: 0, 
        totalCount: 0 
    });

    const [answer, setAnswer] = useState<boolean | undefined>(() => {

        if (passedAnswer && (passedAnswer[0] === true || passedAnswer[0] === false)) {
            return passedAnswer[0];
        }

        return undefined;
    });

    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    const handleOnClickAnswer = (choice: boolean) => {
        setAnswer(choice);
    };

    useEffect(() => {
        if (passedAnswer && (passedAnswer[0] === true || passedAnswer[0] === false)) {
            setAnswer(passedAnswer[0]);
        } else {
            setAnswer(undefined);
        }

        if (!passedAnswer && passedAnswer !== false) {
            setAnswer(undefined);
            calculatePickRates();
        }
    }, [passedAnswer,  question.id, students]);

    const selectedTrue = answer ? 'selected' : '';
    const selectedFalse = answer !== undefined && !answer ? 'selected' : '';

    // Calcul le pick rate de chaque réponse
    const calculatePickRates = () => {
        if (!students) {
            setPickRates({ trueRate: 0, falseRate: 0, trueCount: 0, falseCount: 0, totalCount: 0 });
            return;
        }
    
        const totalAnswers = students.length;
        const trueAnswers = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.answer.some(a => a === true)
            )
        ).length;
        const falseAnswers = students.filter(student =>
            student.answers.some(ans =>
                ans.idQuestion === Number(question.id) && ans.answer.some(a => a === false)
            )
        ).length;
    
        setPickRates({
            trueRate: (trueAnswers / totalAnswers) * 100,
            falseRate: (falseAnswers / totalAnswers) * 100,
            trueCount: trueAnswers,
            falseCount: falseAnswers,
            totalCount: totalAnswers
        });
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-auto question-container">
                    <div className="question content">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                    </div>
                    <div className="choices-wrapper mb-1">
                        <Button
                            className="button-wrapper"
                            onClick={() => !showAnswer && handleOnClickAnswer(true)}
                            fullWidth
                            disabled={disableButton}
                        >
                            {showAnswer ? (<div> {(question.isTrue ? '✅' : '❌')}</div>) : ``}
                            <div className={`circle ${selectedTrue}`}>V</div>
                            <div className={`answer-text ${selectedTrue}`}
                                style={showResults ? {
                                    backgroundImage: `linear-gradient(to right, ${question.isTrue ? 'lightgreen' : 'lightcoral'} ${pickRates.trueRate}%, transparent ${pickRates.trueRate}%)`
                                } : {}}
                            >
                                Vrai
                            </div>
                            {showResults && (
                                <>
                                    <div className="pick-rate">{question.isTrue ? '✅' : '❌'} {pickRates.trueCount}/{pickRates.totalCount} ({pickRates.trueRate.toFixed(1)}%)</div>
                                </>
                            )}

                            {showAnswer && answer && question.trueFormattedFeedback && (
                                <div className="true-feedback mb-2">
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.trueFormattedFeedback) }} />
                                </div>
                            )}
                        </Button>
                        <Button
                            className={`button-wrapper ${selectedFalse}`}
                            onClick={() => !showResults && handleOnClickAnswer(false)}
                            fullWidth
                            disabled={disableButton}

                        >
                            {showAnswer ? (<div> {(!question.isTrue ? '✅' : '❌')}</div>) : ``}
                            <div className={`circle ${selectedFalse}`}>F</div>
                            <div
                                className={`answer-text ${selectedFalse}`}
                                style={showResults ? {
                                    backgroundImage: `linear-gradient(to right, ${!question.isTrue ? 'lightgreen' : 'lightcoral'} ${pickRates.falseRate}%, transparent ${pickRates.falseRate}%)`,
                                } : {}}
                            >
                                Faux
                            </div>

                            {showResults && (
                                <>
                                    <div className="pick-rate">{!question.isTrue ? '✅' : '❌'} {pickRates.falseCount}/{pickRates.totalCount} ({pickRates.falseRate.toFixed(1)}%)</div>
                                </>
                            )}

                            {showAnswer && !answer && question.falseFormattedFeedback && (
                                <div className="false-feedback mb-2">
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.falseFormattedFeedback) }} />
                                </div>
                            )}
                        </Button>


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
                                answer !== undefined && handleOnSubmitAnswer && handleOnSubmitAnswer([answer])
                            }
                            disabled={answer === undefined}
                        >
                            Répondre
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrueFalseQuestionDisplay;
