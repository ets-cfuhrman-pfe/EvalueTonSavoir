import React from 'react';
import { MultipleChoiceQuestion, TrueFalseQuestion, Question } from 'gift-pegjs';
import { FormattedTextTemplate } from 'src/components/GiftTemplate/templates/TextTypeTemplate';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoomV2';
import { Button } from '@mui/material';

interface FeedbackBoxProps {
    question: Question;
    answer?: AnswerType;
    onDismiss?: () => void;
}

const FeedbackBox: React.FC<FeedbackBoxProps> = ({ question, answer, onDismiss }) => {
    if (!question) return null;

    // Numerical and Short answers render feedback inline via forceShowFeedback — not needed here.
    if (question.type === 'Numerical' || question.type === 'Short') return null;

    if (question.type === 'MC') {
        const mc = question as MultipleChoiceQuestion;
        const selectedTexts = new Set(answer?.map(String) ?? []);

        const choiceFeedbacks = mc.choices
            .filter((c) => c.formattedFeedback && selectedTexts.has(c.formattedText.text))
            .map((c, i) => (
                <div key={i} className="alert alert-info small mb-2">
                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(c.formattedFeedback!) }} />
                </div>
            ));

        const hasContent = choiceFeedbacks.length > 0 || mc.formattedGlobalFeedback;
        if (!hasContent) return null;

        return (
            <div className="student-feedback-box" role="dialog" aria-modal="true" aria-label="Rétroactions" data-testid="feedback-box">
                {choiceFeedbacks}
                {mc.formattedGlobalFeedback && (
                    <div className="global-feedback mb-0">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(mc.formattedGlobalFeedback) }} />
                    </div>
                )}
                {onDismiss && (
                    <div className="d-grid mt-3">
                        <Button variant="outlined" size="large" className="quiz-feedback-toggle-btn w-100" onClick={onDismiss}>
                            Masquer rétroactions
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (question.type === 'TF') {
        const tf = question as TrueFalseQuestion;
        const submittedValue = answer?.[0];
        const isTrue = submittedValue === true || submittedValue === 'true';
        const isFalse = submittedValue === false || submittedValue === 'false';

        const specificFeedback = isTrue
            ? tf.trueFormattedFeedback
            : isFalse
            ? tf.falseFormattedFeedback
            : null;

        const hasContent = specificFeedback || tf.formattedGlobalFeedback;
        if (!hasContent) return null;

        return (
            <div className="student-feedback-box" role="dialog" aria-modal="true" aria-label="Rétroactions" data-testid="feedback-box">
                {specificFeedback && (
                    <div className={`${isTrue ? 'true-feedback' : 'false-feedback'} mb-2`}>
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(specificFeedback) }} />
                    </div>
                )}
                {tf.formattedGlobalFeedback && (
                    <div className="global-feedback mb-0">
                        <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate(tf.formattedGlobalFeedback) }} />
                    </div>
                )}
                {onDismiss && (
                    <div className="d-grid mt-3">
                        <Button variant="outlined" size="large" className="quiz-feedback-toggle-btn w-100" onClick={onDismiss}>
                            Masquer rétroactions
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default FeedbackBox;
