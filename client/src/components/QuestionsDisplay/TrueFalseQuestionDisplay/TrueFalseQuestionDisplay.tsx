// TrueFalseQuestion.tsx
import React, { useState, useEffect } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { TrueFalseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { QuizContext } from 'src/pages/Student/JoinRoom/QuizContext';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';


const TrueFalseQuestionDisplay: React.FC = () => {
    
    const { questions, index, answer, submitAnswer } = useQuizContext();

    const question = questions[Number(index)].question as TrueFalseQuestion;

    const [actualAnswer, setActualAnswer] = useState<boolean | undefined>(() => {
        if (answer && (answer[0] === true || answer[0] === false)) {
            return answer[0];
        }
        return undefined;
    });

    let disableButton = false;
    if (submitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        console.log("passedAnswer", answer);
        if (answer && (answer[0] === true || answer[0] === false)) {
            setActualAnswer(answer[0]);
        } else {
            setActualAnswer(undefined);
        }
    }, [answer, index]);

    const handleOnClickAnswer = (choice: boolean) => {
        setActualAnswer(choice);
    };

    const selectedTrue = actualAnswer ? 'selected' : '';
    const selectedFalse = actualAnswer !== undefined && !actualAnswer ? 'selected' : '';

    return (
        <QuizContext.Consumer>
            {({ showAnswer }) => (
                <div className="question-container">
                    <div className="question content">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: FormattedTextTemplate(question.formattedStem),
                            }}
                        />
                    </div>
                    <div className="choices-wrapper mb-1">
                        <Button
                            className="button-wrapper"
                            onClick={() => !showAnswer && handleOnClickAnswer(true)}
                            fullWidth
                            disabled={disableButton}
                        >
                            {showAnswer ? (
                                <div> {question.isTrue ? '✅' : '❌'}</div>
                            ) : (
                                ''
                            )}
                            <div className={`circle ${selectedTrue}`}>V</div>
                            <div className={`answer-text ${selectedTrue}`}>Vrai</div>

                            {showAnswer && actualAnswer && question.trueFormattedFeedback && (
                                <div className="true-feedback mb-2">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: FormattedTextTemplate(
                                                question.trueFormattedFeedback
                                            ),
                                        }}
                                    />
                                </div>
                            )}
                        </Button>
                        <Button
                            className="button-wrapper"
                            onClick={() => !showAnswer && handleOnClickAnswer(false)}
                            fullWidth
                            disabled={disableButton}
                        >
                            {showAnswer ? (
                                <div> {!question.isTrue ? '✅' : '❌'}</div>
                            ) : (
                                ''
                            )}
                            <div className={`circle ${selectedFalse}`}>F</div>
                            <div className={`answer-text ${selectedFalse}`}>Faux</div>

                            {showAnswer && !actualAnswer && question.falseFormattedFeedback && (
                                <div className="false-feedback mb-2">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: FormattedTextTemplate(
                                                question.falseFormattedFeedback
                                            ),
                                        }}
                                    />
                                </div>
                            )}
                        </Button>
                    </div>
                    {question.formattedGlobalFeedback && showAnswer && (
                        <div className="global-feedback mb-2">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: FormattedTextTemplate(
                                        question.formattedGlobalFeedback
                                    ),
                                }}
                            />
                        </div>
                    )}
                    {!showAnswer && submitAnswer && (
                        <Button
                            variant="contained"
                            onClick={() =>
                                actualAnswer !== undefined &&
                                submitAnswer &&
                                submitAnswer([actualAnswer])
                            }
                            disabled={actualAnswer === undefined}
                        >
                            Répondre
                        </Button>
                    )}
                </div>
            )}
        </QuizContext.Consumer>
    );
};

export default TrueFalseQuestionDisplay;
