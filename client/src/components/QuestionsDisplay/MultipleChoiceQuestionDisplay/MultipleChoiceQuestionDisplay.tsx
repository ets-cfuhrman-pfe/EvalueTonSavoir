// MultipleChoiceQuestionDisplay.tsx
import React, { useEffect, useState } from 'react';
import '../questionStyle.css';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { useQuizContext } from 'src/pages/Student/JoinRoom/QuizContext';
import { QuizContext } from 'src/pages/Student/JoinRoom/QuizContext';

const MultipleChoiceQuestionDisplay: React.FC = () => {
    const { questions, index, submitAnswer,answers } = useQuizContext();
    console.log("questions", index);

    const answer = answers[Number(index)]?.answer;
    const question = questions[Number(index)].question as MultipleChoiceQuestion;

    const [actualAnswer, setActualAnswer] = useState<AnswerType | undefined>(() => {
        if (answer !== undefined) {
            return answers[Number(index)].answer;
        }
        return undefined;
    });

    useEffect(() => {
        if (answer !== undefined) {
            setActualAnswer(answer);
        } else {
            setActualAnswer(undefined);
        }
    }, [index]);

    const handleOnClickAnswer = (choice: string) => {
        setActualAnswer((answer) => {
            console.log(`handleOnClickAnswer -- setAnswer(): prevAnswer: ${answer}, choice: ${choice}`);
            const correctAnswersCount = question.choices.filter((c) => c.isCorrect).length;

            if (correctAnswersCount === 1) {
                // If only one correct answer, replace the current selection
                return answer?.includes(choice) ? [] : [choice];
            } else {
                // Allow multiple selections if there are multiple correct answers
                if (answer?.includes(choice)) {
                    // Remove the choice if it's already selected
                    return answer.filter((selected) => selected !== choice);
                } else {
                    // Add the choice if it's not already selected
                    return [...(answer || []), choice];
                }
            }
        });
    };

    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));

    return (
        <QuizContext.Consumer>
            {({ showAnswer, isTeacherMode }) => (
                <div className="question-container">
                    <div className="question content">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
                    </div>
                    <div className="choices-wrapper mb-1">
                        {question.choices.map((choice, i) => {
                            console.log(`answer: ${actualAnswer}, choice: ${choice.formattedText.text}`);
                            const selected = actualAnswer?.includes(choice.formattedText.text) ? 'selected' : '';
                            return (
                                <div key={choice.formattedText.text + i} className="choice-container">
                                    <Button
                                        variant="text"
                                        className="button-wrapper"
                                        disabled={isTeacherMode}
                                        onClick={() => !showAnswer && handleOnClickAnswer(choice.formattedText.text)}
                                    >
                                        {showAnswer ? (
                                            <div>{choice.isCorrect ? '✅' : '❌'}</div>
                                        ) : (
                                            ''
                                        )}
                                        <div className={`circle ${selected}`}>{alphabet[i]}</div>
                                        <div className={`answer-text ${selected}`}>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: FormattedTextTemplate(choice.formattedText),
                                                }}
                                            />
                                        </div>
                                        {choice.formattedFeedback && showAnswer && (
                                            <div className="feedback-container mb-1 mt-1/2">
                                                <div
                                                    dangerouslySetInnerHTML={{
                                                        __html: FormattedTextTemplate(choice.formattedFeedback),
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                    {question.formattedGlobalFeedback && showAnswer && (
                        <div className="global-feedback mb-2">
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: FormattedTextTemplate(question.formattedGlobalFeedback),
                                }}
                            />
                        </div>
                    )}
                    {!showAnswer && submitAnswer && !isTeacherMode &&(
                        <Button
                            variant="contained"
                            onClick={() =>
                                actualAnswer !== undefined && submitAnswer && submitAnswer(actualAnswer)
                            }
                            disabled={actualAnswer === undefined || actualAnswer.length === 0}
                        >
                            Répondre
                        </Button>
                    )}
                </div>
            )}
        </QuizContext.Consumer>
    );
};

export default MultipleChoiceQuestionDisplay;
