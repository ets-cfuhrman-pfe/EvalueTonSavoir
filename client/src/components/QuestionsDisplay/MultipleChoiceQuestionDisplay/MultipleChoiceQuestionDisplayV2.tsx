// MultipleChoiceQuestionDisplayV2.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { FormattedTextTemplate } from '../../GiftTemplate/templates/TextTypeTemplate';
import { MultipleChoiceQuestion } from 'gift-pegjs';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import { StudentType } from 'src/Types/StudentType';
import { calculateAnswerStatistics, getAnswerPercentage } from 'src/utils/answerStatistics';

interface PropsV2 {
    question: MultipleChoiceQuestion;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    passedAnswer?: AnswerType;
    disabled?: boolean;
    students?: StudentType[];
    showStatistics?: boolean;
}

const MultipleChoiceQuestionDisplayV2: React.FC<PropsV2> = (props) => {
    const { question, showAnswer, handleOnSubmitAnswer, passedAnswer, disabled = false, students = [], showStatistics = false } = props;
    // console.log('MultipleChoiceQuestionDisplayV2: passedAnswer', JSON.stringify(passedAnswer));

    const [answer, setAnswer] = useState<AnswerType>(() => {
        if (passedAnswer && passedAnswer.length > 0) {
            return passedAnswer;
        }
        return [];
    });

    let disableButton = false;
    if (handleOnSubmitAnswer === undefined) {
        disableButton = true;
    }

    useEffect(() => {
        // console.log('MultipleChoiceQuestionDisplayV2: passedAnswer', JSON.stringify(passedAnswer));
        if (passedAnswer !== undefined) {
            setAnswer(passedAnswer);
        } else {
            setAnswer([]);
        }
    }, [passedAnswer, question.id]);

    // Prevent validation styling from showing immediately on question change
    // For teacher view (no handleOnSubmitAnswer), show validation when showAnswer is true
    // For student view, only show validation after they've submitted an answer
    const shouldShowValidation = showAnswer && (handleOnSubmitAnswer === undefined || answer.length > 0);

    const handleOnClickAnswer = (choice: string) => {
        setAnswer((prevAnswer) => {
            // console.log(`handleOnClickAnswer -- setAnswer(): prevAnswer: ${prevAnswer}, choice: ${choice}`);
            const correctAnswersCount = question.choices.filter((c) => c.isCorrect).length;

            if (correctAnswersCount === 1) {
                // If only one correct answer, replace the current selection
                return prevAnswer.includes(choice) ? [] : [choice];
            } else {
                // Allow multiple selections if there are multiple correct answers
                if (prevAnswer.includes(choice)) {
                    // Remove the choice if it's already selected
                    return prevAnswer.filter((selected) => selected !== choice);
                } else {
                    // Add the choice if it's not already selected
                    return [...prevAnswer, choice];
                }
            }
        });
    };

    const alpha = Array.from(Array(26)).map((_e, i) => i + 65);
    const alphabet = alpha.map((x) => String.fromCharCode(x));

    // Calculate answer statistics if we should show them
    const answerStatistics = showStatistics ? calculateAnswerStatistics(students, Number(question.id)) : {};

    return (
        <div className="quiz-question-area">
            {/* Question text */}
            <div className="mb-4">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(question.formattedStem) }} />
            </div>

            {/* Choices */}
            <div className="mb-4">
                {question.choices.map((choice, i) => {
                    // console.log(`answer: ${answer}, choice: ${choice.formattedText.text}`);
                    const selected = answer.includes(choice.formattedText.text) ? 'selected' : '';
                    return (
                        <div key={choice.formattedText.text + i} className="mb-3">
                            <Button
                                variant="outlined"
                                className={`w-100 text-start justify-content-start p-3 choice-button ${
                                    shouldShowValidation 
                                        ? (choice.isCorrect ? 'bg-success text-white' : 'bg-danger text-white')
                                        : (selected ? 'bg-primary text-white choice-button-selected' : 'bg-light text-dark')
                                } ${shouldShowValidation && selected ? 'choice-button-validated-selected' : ''}`}
                                disabled={disableButton || disabled}
                                onClick={() => !shouldShowValidation && !disabled && handleOnClickAnswer(choice.formattedText.text)}
                            >
                                <div className="d-flex align-items-center w-100">
                                    <div 
                                        className={`choice-letter d-flex align-items-center justify-content-center me-3 rounded-circle border ${
                                            shouldShowValidation 
                                                ? (choice.isCorrect ? 'bg-white text-success' : 'bg-white text-danger')
                                                : (selected ? 'bg-white text-primary' : 'bg-white text-dark')
                                        }`}
                                    >
                                        {alphabet[i]}
                                    </div>
                                    <div className="flex-grow-1">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: FormattedTextTemplate(choice.formattedText),
                                            }}
                                        />
                                    </div>
                                    {showStatistics && (
                                        <div className="ms-auto">
                                            <span className="stats-badge">
                                                {getAnswerPercentage(answerStatistics, choice.formattedText.text)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Button>
                            {choice.formattedFeedback && showAnswer && (
                                <div className="mt-2">
                                    <div className="alert alert-info small">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: FormattedTextTemplate(choice.formattedFeedback),
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Submit button */}
            {!showAnswer && handleOnSubmitAnswer && (
                <div className="d-grid gap-2 mb-4">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={() =>
                            answer.length > 0 && handleOnSubmitAnswer?.(answer)
                        }
                        disabled={answer.length === 0 || disabled}
                        className="btn-primary"
                    >
                        Répondre
                    </Button>
                </div>
            )}

            {/* Global feedback - always reserve space */}
            <div className="d-flex flex-column">
                {question.formattedGlobalFeedback && showAnswer && (
                    <div className="global-feedback">
                        <div
                            dangerouslySetInnerHTML={{
                                __html: FormattedTextTemplate(question.formattedGlobalFeedback),
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultipleChoiceQuestionDisplayV2;