import { parse } from 'gift-pegjs';

import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { applyQuestionPrintLayout } from './printLayout';
import { applyHideAnswersMask } from './hideAnswersMask';
import { formatGiftParseErrorMessage, isPegjsParseError } from 'src/utils/giftDiagnostics';

export type GiftPreviewErrorMode = 'plain' | 'preview';

export interface BuildGiftPreviewHtmlOptions {
    hideAnswers?: boolean;
    printLayout?: boolean;
    errorMode?: GiftPreviewErrorMode;
    questionStartLines?: number[];
}

function buildErrorMarkup(
    error: unknown,
    errorMode: GiftPreviewErrorMode,
    blockStartLine: number = 1
): string {
    let errorHtml: string;

    if (errorMode === 'preview') {
        if (error instanceof UnsupportedQuestionTypeError) {
            errorHtml = ErrorTemplate(`Erreur: ${error.message}`);
        } else if (isPegjsParseError(error)) {
            errorHtml = ErrorTemplate(formatGiftParseErrorMessage(error, blockStartLine));
        } else if (error instanceof Error) {
            errorHtml = ErrorTemplate(`Erreur GIFT: ${error.message}`);
        } else {
            errorHtml = ErrorTemplate('Erreur inconnue');
        }

        return `<div class="alert alert-danger" role="alert">${errorHtml}</div>`;
    }

    if (error instanceof Error) {
        errorHtml = ErrorTemplate(error.message);
    } else {
        errorHtml = ErrorTemplate('Erreur inconnue');
    }

    return errorHtml;
}

export function buildGiftPreviewHtml(
    questions: string[],
    {
        hideAnswers = false,
        printLayout = false,
        errorMode = 'plain',
        questionStartLines = [],
    }: BuildGiftPreviewHtmlOptions = {}
): string {
    let previewHtml = '';

    questions.forEach((giftQuestion, index) => {
        let questionMarkup = '';
        const blockStartLine = questionStartLines[index] ?? 1;

        try {
            const question = parse(giftQuestion);
            questionMarkup = Template(question[0], {
                preview: true,
                theme: 'light',
            });
        } catch (error) {
            questionMarkup = buildErrorMarkup(error, errorMode, blockStartLine);
        }

        previewHtml += `<div class="gift-preview-question-anchor" data-question-index="${index}">${questionMarkup}</div>`;
    });

    if (printLayout) {
        previewHtml = applyQuestionPrintLayout(previewHtml);
    }

    if (hideAnswers) {
        previewHtml = applyHideAnswersMask(previewHtml);
    }

    return previewHtml;
}
