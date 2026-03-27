// GIFTTemplatePreviewV2.tsx
import React, { useEffect, useState } from 'react';
import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { parse } from 'gift-pegjs';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';
import { applyQuestionPrintLayout } from './printLayout';

interface GIFTTemplatePreviewV2Props {
    questions: string[];
    hideAnswers?: boolean;
}

function applyHideAnswersMask(previewHtml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, 'text/html');

    doc.querySelectorAll<HTMLElement>('.choice-button').forEach((choiceButton) => {
        choiceButton.classList.remove('bg-success', 'bg-danger', 'text-white');
        choiceButton.classList.add('bg-light', 'text-dark');
    });

    doc.querySelectorAll<HTMLElement>('.choice-letter').forEach((choiceLetter) => {
        choiceLetter.classList.remove('text-success', 'text-danger', 'border-success', 'border-danger');
        choiceLetter.classList.add('text-dark');
    });

    doc.querySelectorAll('.alert.alert-info.small, .true-feedback, .false-feedback, .gift-preview-feedback, .feedback-container').forEach((feedbackNode) => {
        feedbackNode.remove();
    });

    doc.querySelectorAll<HTMLInputElement>('input.gift-preview-input').forEach((answerInput) => {
        answerInput.setAttribute('placeholder', '');
    });

    return doc.body.innerHTML;
}

const GIFTTemplatePreviewV2: React.FC<GIFTTemplatePreviewV2Props> = ({
    questions,
    hideAnswers = false
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [items, setItems] = useState('');

    useEffect(() => {
        try {
            let previewHTML = '';
            questions.forEach((giftQuestion) => {
                try {
                    const question = parse(giftQuestion);
                    previewHTML += Template(question[0], {
                        preview: true,
                        theme: 'light'
                    });
                } catch (error) {
                    let errorMsg: string;
                    if (error instanceof UnsupportedQuestionTypeError) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur: ${error.message}`);
                    } else if (error instanceof Error) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur GIFT: ${error.message}`);
                    } else {
                        errorMsg = ErrorTemplate(giftQuestion, 'Erreur inconnue');
                    }
                    previewHTML += `<div class="alert alert-danger" role="alert">${errorMsg}</div>`;
                }
            });

            previewHTML = applyQuestionPrintLayout(previewHTML);

            if (hideAnswers) {
                previewHTML = applyHideAnswersMask(previewHTML);
            }

            setItems(previewHTML);
            setIsPreviewReady(true);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Une erreur est survenue durant le chargement de la prévisualisation.');
            }
        }
    }, [questions, hideAnswers]);

    if (error) {
        return <div className="alert alert-danger" role="alert">{error}</div>;
    }

    if (!isPreviewReady) {
        return <div className="text-muted">Chargement de la prévisualisation...</div>;
    }

    return (
        <div data-testid="preview-container" className="preview-container">
            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: items }) }}></div>
        </div>
    );
};

export default GIFTTemplatePreviewV2;