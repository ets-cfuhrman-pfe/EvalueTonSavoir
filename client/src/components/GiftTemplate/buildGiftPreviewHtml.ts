import { parse } from 'gift-pegjs';

import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { applyQuestionPrintLayout } from './printLayout';
import { applyHideAnswersMask } from './hideAnswersMask';

export type GiftPreviewErrorMode = 'plain' | 'preview';

export interface BuildGiftPreviewHtmlOptions {
    hideAnswers?: boolean;
    printLayout?: boolean;
    errorMode?: GiftPreviewErrorMode;
}

function buildErrorMarkup(
    giftQuestion: string,
    error: unknown,
    errorMode: GiftPreviewErrorMode
): string {
    let errorHtml: string;

    if (errorMode === 'preview') {
        if (error instanceof UnsupportedQuestionTypeError) {
            errorHtml = ErrorTemplate(giftQuestion, `Erreur: ${error.message}`);
        } else if (error instanceof Error) {
            errorHtml = ErrorTemplate(giftQuestion, `Erreur GIFT: ${error.message}`);
        } else {
            errorHtml = ErrorTemplate(giftQuestion, 'Erreur inconnue');
        }

        return `<div class="alert alert-danger" role="alert">${errorHtml}</div>`;
    }

    if (error instanceof Error) {
        errorHtml = ErrorTemplate(giftQuestion, error.message);
    } else {
        errorHtml = ErrorTemplate(giftQuestion, 'Erreur inconnue');
    }

    return errorHtml;
}

export function buildGiftPreviewHtml(
    questions: string[],
    {
        hideAnswers = false,
        printLayout = false,
        errorMode = 'plain',
    }: BuildGiftPreviewHtmlOptions = {}
): string {
    let previewHtml = '';

    questions.forEach((giftQuestion) => {
        try {
            const question = parse(giftQuestion);
            previewHtml += Template(question[0], {
                preview: true,
                theme: 'light',
            });
        } catch (error) {
            previewHtml += buildErrorMarkup(giftQuestion, error, errorMode);
        }
    });

    if (printLayout) {
        previewHtml = applyQuestionPrintLayout(previewHtml);
    }

    if (hideAnswers) {
        previewHtml = applyHideAnswersMask(previewHtml);
    }

    return previewHtml;
}
