// MultipleChoiceQuestionDisplay.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { StudentType } from 'src/Types/StudentType';

interface Props {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: string) => void;
    showAnswer?: boolean;
    students?: StudentType[];
    isDisplayOnly?: boolean;
}

const MultipleChoiceQuestionDisplay: React.FC<Props> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, students, isDisplayOnly } = props;
    const [answer, setAnswer] = useState<string>();
    const [pickRates, setPickRates] = useState<number[]>([]);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState(false);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer(choice);
    };

    const toggleShowCorrectAnswers = () => {
        setShowCorrectAnswers(!showCorrectAnswers);
    };
    
    const calculatePickRates = () => {
        if (!students || students.length === 0) {
            setPickRates(new Array(question.choices.length).fill(0)); // Fill with 0 for each choice
            return;
        }
    
        const rates = question.choices.map(choice => {
            const choiceAnswers = students.filter(student =>
                student.answers.some(ans =>
                    ans.idQuestion === Number(question.id) && ans.answer === choice.formattedText.text
                )
            ).length;
            return (choiceAnswers / students.length) * 100;
        });
    
        setPickRates(rates);
    };

    useEffect(() => {
        setAnswer(undefined);
        calculatePickRates();
    }, [students, question, showCorrectAnswers]);
    

    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));
    return (
        <div className="question-container">
            <div className="question content">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>
            <div className="choices-wrapper mb-1">
                {question.choices.map((choice, i) => {
                    const selected = answer === choice.formattedText.text ? 'selected' : '';
                    const rateStyle = showCorrectAnswers ? {
                        backgroundImage: `linear-gradient(to right, ${choice.isCorrect ? 'lightgreen' : 'lightcoral'} ${pickRates[i]}%, transparent ${pickRates[i]}%)`,
                        color: 'black'
                    } : {};
                    return (
                        <div key={choice.formattedText.text + i} className="choice-container">
                            {/* <Button
                                variant="text"
                                className="button-wrapper"
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
                                {showCorrectAnswers && <div>{choice.isCorrect ? '✅' : '❌'}</div>}
                                {showCorrectAnswers && (
                                    <div className="pick-rate">
                                        {pickRates[i].toFixed(1)}%
                                    </div>
                                )}
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

export default MultipleChoiceQuestionDisplay;
