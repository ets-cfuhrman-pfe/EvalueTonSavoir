import React from 'react';
import { Question } from 'gift-pegjs';

import TrueFalseQuestionDisplayV2 from './TrueFalseQuestionDisplay/TrueFalseQuestionDisplayV2';
import MultipleChoiceQuestionDisplayV2 from './MultipleChoiceQuestionDisplay/MultipleChoiceQuestionDisplayV2';
import NumericalQuestionDisplayV2 from './NumericalQuestionDisplay/NumericalQuestionDisplayV2';
import ShortAnswerQuestionDisplayV2 from './ShortAnswerQuestionDisplay/ShortAnswerQuestionDisplayV2';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import { Student } from 'src/Types/StudentType';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';

interface QuestionV2Props {
    question: Question;
    handleOnSubmitAnswer?: (answer: AnswerType) => void;
    showAnswer?: boolean;
    answer?: AnswerType;
    buttonText?: string;
    disabled?: boolean;
    students?: Student[];
    showStatistics?: boolean;
    hideAnswerFeedback?: boolean;
    showCorrectnessBanner?: boolean;
    sideImageLayout?: boolean;
}

/**
 * Parses already-rendered stem HTML, extracts all <img> elements from it,
 * and returns the cleaned HTML (without images) along with each image's outerHTML.
 */
function extractImages(html: string): { cleanHtml: string; images: string[] } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const imgElements = Array.from(doc.body.querySelectorAll('img'));
    const images = imgElements.map((img) => img.outerHTML);
    imgElements.forEach((img) => img.remove());
    return { cleanHtml: doc.body.innerHTML, images };
}

/**
 * Builds the appropriate question sub-component for the given question type.
 * Returns null when the type is unrecognised or unsupported.
 */
function buildQuestionComponent(
    question: Question,
    props: {
        handleOnSubmitAnswer?: (answer: AnswerType) => void;
        showAnswer?: boolean;
        answer?: AnswerType;
        buttonText: string;
        disabled: boolean;
        students: Student[];
        showStatistics: boolean;
        appliedHideAnswerFeedback: boolean;
        showCorrectnessBanner: boolean;
    }
): React.ReactElement | null {
    const {
        handleOnSubmitAnswer,
        showAnswer,
        answer,
        buttonText,
        disabled,
        students,
        showStatistics,
        appliedHideAnswerFeedback,
        showCorrectnessBanner,
    } = props;

    switch (question?.type) {
        case 'TF':
            return (
                <TrueFalseQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                    students={students}
                    showStatistics={showStatistics}
                    hideAnswerFeedback={appliedHideAnswerFeedback}
                    showCorrectnessBanner={showCorrectnessBanner}
                />
            );
        case 'MC':
            return (
                <MultipleChoiceQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                    students={students}
                    showStatistics={showStatistics}
                    hideAnswerFeedback={appliedHideAnswerFeedback}
                    showCorrectnessBanner={showCorrectnessBanner}
                />
            );
        case 'Numerical':
            if (question.choices) {
                return (
                    <NumericalQuestionDisplayV2
                        question={question}
                        handleOnSubmitAnswer={handleOnSubmitAnswer}
                        showAnswer={showAnswer}
                        passedAnswer={answer}
                        buttonText={buttonText}
                        disabled={disabled}
                        hideAnswerFeedback={appliedHideAnswerFeedback}
                    />
                );
            }
            return null;
        case 'Short':
            return (
                <ShortAnswerQuestionDisplayV2
                    question={question}
                    handleOnSubmitAnswer={handleOnSubmitAnswer}
                    showAnswer={showAnswer}
                    passedAnswer={answer}
                    buttonText={buttonText}
                    disabled={disabled}
                    hideAnswerFeedback={appliedHideAnswerFeedback}
                />
            );
        default:
            return null;
    }
}

const QuestionDisplayV2: React.FC<QuestionV2Props> = ({
    question,
    handleOnSubmitAnswer,
    showAnswer,
    answer,
    buttonText = 'Répondre',
    disabled = false,
    students = [],
    showStatistics = false,
    hideAnswerFeedback = false,
    showCorrectnessBanner = true,
    sideImageLayout = false,
}) => {
    const forceShowFeedback = question?.type === 'Numerical' || question?.type === 'Short';

    // For numerical and short answers we always show feedback once answered; override hideAnswerFeedback
    const appliedHideAnswerFeedback = forceShowFeedback ? false : hideAnswerFeedback;

    const sharedProps = {
        handleOnSubmitAnswer,
        showAnswer,
        answer,
        buttonText,
        disabled,
        students,
        showStatistics,
        appliedHideAnswerFeedback,
        showCorrectnessBanner,
    };

    // Side-by-side image layout 
    // When enabled, render the question stem HTML, extract any <img> tags from
    // it, pass a cleaned stem to the sub-component, and show the images in a
    // column on the right.  Falls back to normal layout when no images are found.
    if (sideImageLayout && question?.type !== 'Category' && question?.formattedStem) {
        const renderedStemHtml = FormattedTextTemplate(question.formattedStem);
        const { cleanHtml, images } = extractImages(renderedStemHtml);

        if (images.length > 0) {
            const cleanedQuestion: Question = {
                ...question,
                formattedStem: { format: 'html', text: cleanHtml },
            } as Question;

            const cleanedComponent = buildQuestionComponent(cleanedQuestion, sharedProps);

            return (
                <div className="side-image-layout">
                    <div className="side-image-layout__content">
                        {cleanedComponent ?? <div className="alert alert-warning">Question de type inconnue</div>}
                    </div>
                    <div className="side-image-layout__images">
                        {images.map((imgHtml) => (
                            <div
                                key={imgHtml}
                                dangerouslySetInnerHTML={{ __html: imgHtml }}
                            />
                        ))}
                    </div>
                </div>
            );
        }
    }

    const questionTypeComponent = buildQuestionComponent(question, sharedProps);

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    {questionTypeComponent ? (
                        <>{questionTypeComponent}</>
                    ) : (
                        <div className="alert alert-warning">Question de type inconnue</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionDisplayV2;