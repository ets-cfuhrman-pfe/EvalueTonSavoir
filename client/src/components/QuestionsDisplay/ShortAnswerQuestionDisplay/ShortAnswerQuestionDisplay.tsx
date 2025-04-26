import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button, TextField } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { ShortAnswerQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';
import { QuizContext } from 'src/pages/Student/JoinRoom/QuizContext';


const ShortAnswerQuestionDisplay: React.FC = () => {

    const { questions, index, submitAnswer, answers } = useQuizContext();
    
    const answer = answers[Number(index)]?.answer;
    const [actualAnswer, setActualAnswer] = useState<AnswerType>(answer || []);
    const question = questions[Number(index)].question as ShortAnswerQuestion;

    useEffect(() => {
        if (answer !== undefined) {
            setActualAnswer(answer);
        }
    }, [answer]);
    console.log("Answer", actualAnswer);

    return (
        <QuizContext.Consumer>
            {({ showAnswer, isTeacherMode }) => (
                <div className="question-wrapper">
                    <div className="question content">
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
                                    <strong>Votre réponse est: </strong>{actualAnswer}
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
                                        setActualAnswer([e.target.value]);
                                    }}
                                    disabled={showAnswer || isTeacherMode}
                                    aria-label="short-answer-input"
                                />
                            </div>
                            {submitAnswer && !isTeacherMode && (
                                <Button
                                    variant="contained"
                                    onClick={() =>
                                        actualAnswer !== undefined &&
                                        submitAnswer &&
                                        submitAnswer(actualAnswer)
                                    }
                                    disabled={actualAnswer === null || actualAnswer === undefined || actualAnswer.length === 0}
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

export default ShortAnswerQuestionDisplay;
