// MultipleChoiceQuestionDisplay.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { StudentType } from 'src/Types/StudentType';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

interface Props {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const MultipleChoiceQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, isDisplayOnly, passedAnswer } = props;
    const [answer, setAnswer] = useState<AnswerType>(passedAnswer || '');
    const [pickRates, setPickRates] = useState<{ percentages: number[], counts: number[], totalCount: number }>({ percentages: [], counts: [], totalCount: 0 });
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    let disableButton = false;
    if(handleOnSubmitAnswer === undefined){
        disableButton = true;
    }

    const handleOnClickAnswer = (choice: string) => {
        setAnswer(choice);
    };

    const toggleShowCorrectAnswers = () => {
        setShowCorrectAnswers(!showCorrectAnswers);
    };
    
    const calculatePickRates = () => {
        if (!students || students.length === 0) {
            setPickRates({ percentages: new Array(question.choices.length).fill(0), counts: new Array(question.choices.length).fill(0), totalCount: 0 });
            return;
        }

        const rates: number[] = [];
        const counts: number[] = [];
        let totalResponses = 0;

        question.choices.forEach(choice => {
            const choiceCount = students.filter(student =>
                student.answers.some(ans =>
                    ans.idQuestion === Number(question.id) && ans.answer === choice.formattedText.text
                )
            ).length;
            totalResponses += choiceCount;
            rates.push((choiceCount / students.length) * 100);
            counts.push(choiceCount);
        });

        setPickRates({ percentages: rates, counts: counts, totalCount: totalResponses });
    };

    useEffect(() => {
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        } else {
            setAnswer('');
            calculatePickRates();
        }
    }, [passedAnswer, students, question, showCorrectAnswers]);
    

    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));
    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-auto question-container">
                    <div className="question content">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                    </div>
                    <div className="choices-wrapper mb-1">
                        
                        {question.choices.map((choice, i) => {
                            const selected = answer === choice.formattedText.text ? 'selected' : '';
                            const rateStyle = showCorrectAnswers ? {
                                backgroundImage: `linear-gradient(to right, ${choice.isCorrect ? 'lightgreen' : 'lightcoral'} ${pickRates.percentages[i]}%, transparent ${pickRates.percentages[i]}%)`,
                                color: 'black'
                            } : {};
                            return (
                                <div key={choice.formattedText.text + i} className="choice-container">
                                    {/* <Button
                                        variant="text"
                                        className="button-wrapper"
                                        disabled={disableButton}
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
                                    </Button> */}
                                    <Button
                                        variant="text"
                                        className={`button-wrapper ${selected}`}
                                        disabled={disableButton}
                                        onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}
                                        >
                                        <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                        <div className={`answer-text ${selected}`}
                                        style={rateStyle}>
                                            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(choice.formattedText) }} />
                                        </div>
                                        {choice.formattedFeedback && showAnswer && (
                                            <div className="feedback-container mb-1 mt-1/2">
                                                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(choice.formattedFeedback) }} />
                                            </div>
                                        )}
                                        {showCorrectAnswers && <div className="pick-rate">{choice.isCorrect ? '✅' : '❌'} {`${pickRates.counts[i]}/${pickRates.totalCount} (${pickRates.percentages[i].toFixed(1)}%)`}</div>}
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
                                answer !== "" && handleOnSubmitAnswer && handleOnSubmitAnswer(answer)
                            }
                            disabled={answer === '' || answer === null}
                        >
                            Répondre
                            
                        </Button>
                    )}
                </div>
                {isDisplayOnly && (
                        <div className="col-auto d-flex align-items-center justify-content-end">
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
        </div>
    );
};

export default MultipleChoiceQuestionDisplay;
