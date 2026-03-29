import { parse } from 'gift-pegjs';

import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { applyQuestionPrintLayout } from './printLayout';
import { applyHideAnswersMask } from './hideAnswersMask';

export type GiftPreviewErrorMode = 'plain' | 'preview';

export interface BuildGiftPreviewHtmlOptions {
    hideAnswers?: boolean;
    printLayout?: boolean;
    errorMode?: GiftPreviewErrorMode;
    startLineNumbers?: number[];
}

function buildErrorMarkup(
    error: any,
    errorMode: GiftPreviewErrorMode,
    startLineNumber: number = 1
): string {
    let errorHtml: string;
    let errorMessage = 'Erreur inconnue';

    const hasLocation = error && typeof error === 'object' && 'location' in error;
    if (hasLocation) {
        const absoluteLine = startLineNumber + error.location.start.line - 1;
        errorMessage = `Line ${absoluteLine}, column ${error.location.start.column}: ${error.message}`;
    } else if (error instanceof UnsupportedQuestionTypeError) {
        errorMessage = `Erreur: ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = `Erreur GIFT: ${error.message}`;
    }

    errorHtml = ErrorTemplate(errorMessage);

    if (errorMode === 'preview') {
        return `<div class="alert alert-danger" role="alert">${errorHtml}</div>`;
    }

    return errorHtml;
}

export function buildGiftPreviewHtml(
    questions: string[],
    {
        hideAnswers = false,
        printLayout = false,
        errorMode = 'plain',
        startLineNumbers,
    }: BuildGiftPreviewHtmlOptions = {}
): string {
    let previewHtml = '';

    questions.forEach((giftQuestion, index) => {
        try {
            const question = parse(giftQuestion);
            previewHtml += Template(question[0], {
                preview: true,
                theme: 'light',
            });
        } catch (error) {
            const startLine = startLineNumbers && startLineNumbers[index] !== undefined 
                ? startLineNumbers[index] 
                : 1;
            previewHtml += buildErrorMarkup(error, errorMode, startLine);
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
