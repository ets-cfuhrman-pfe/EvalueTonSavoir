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

interface GiftErrorLocation {
    line: number;
    column: number;
}

function extractGiftErrorLocation(error: any, startLineNumber: number): GiftErrorLocation | null {
    const start = error?.location?.start;
    if (!start || typeof start.line !== 'number' || typeof start.column !== 'number') {
        return null;
    }

    return {
        line: startLineNumber + start.line - 1,
        column: start.column,
    };
}

function buildErrorMarkup(
    error: any,
    errorMode: GiftPreviewErrorMode,
    startLineNumber: number = 1
): string {
    let errorHtml: string;
    let errorMessage = 'Erreur inconnue';
    const errorLocation = extractGiftErrorLocation(error, startLineNumber);

    if (errorLocation) {
        errorMessage = `Line ${errorLocation.line}, column ${errorLocation.column}: ${error.message}`;
    } else if (error instanceof UnsupportedQuestionTypeError) {
        errorMessage = `Erreur: ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = `Erreur GIFT: ${error.message}`;
    }

    errorHtml = ErrorTemplate(errorMessage);

    if (errorMode === 'preview') {
        const jumpLink = errorLocation
            ? `<a href="#editor-textarea" class="gift-preview-error-link" data-gift-error-link="true" data-line="${errorLocation.line}" data-column="${errorLocation.column}">Aller a la ligne ${errorLocation.line}, colonne ${errorLocation.column}</a>`
            : '';
        const jumpLinkContainer = jumpLink ? `<div class="mt-2">${jumpLink}</div>` : '';

        return `<div class="alert alert-danger" role="alert">${errorHtml}${jumpLinkContainer}</div>`;
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
            const startLine = startLineNumbers?.[index] ?? 1;
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
