import { TemplateOptions } from './types';
import {FormattedTextTemplate} from './TextTypeTemplate';
import { MultipleChoiceQuestion, TextChoice } from 'gift-pegjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type MultipleChoiceAnswerOptions = TemplateOptions & Pick<MultipleChoiceQuestion, 'choices'>;

type AnswerFeedbackOptions = TemplateOptions & Pick<TextChoice, 'formattedFeedback'>;

export default function MultipleChoiceAnswersTemplate({ choices }: MultipleChoiceAnswerOptions) {
    const hasManyCorrectChoices = choices.filter(({ isCorrect }) => isCorrect === true).length > 1;

    const result = choices
        .map(({ weight, isCorrect, formattedText, formattedFeedback }, i) => {
            const isPositiveWeight = (weight != undefined) && (weight > 0);
            const isCorrectOption = hasManyCorrectChoices ? isPositiveWeight || isCorrect : isCorrect;
            const answerStateClass = isCorrectOption ? 'bg-success text-white' : 'bg-danger text-white';

            const letterClass = isCorrectOption
                ? 'bg-white text-success border-success'
                : 'bg-white text-danger border-danger';

            return `
        <div class="mb-3">
          <div class="d-flex align-items-center w-100 p-3 choice-button ${answerStateClass}">
            <div class="choice-letter d-flex align-items-center justify-content-center me-3 rounded-circle border ${letterClass}">
              ${ALPHABET[i] ?? i + 1}
            </div>
            <div class="flex-grow-1 choice-button-content">
              ${FormattedTextTemplate(formattedText)}
            </div>
          </div>
          ${AnswerFeedback({ formattedFeedback: formattedFeedback })}
        </div>
        `;
        })
        .join('');

    return result;
}

function AnswerFeedback({ formattedFeedback }: AnswerFeedbackOptions): string {
    return formattedFeedback
        ? `<div class="mt-2"><div class="alert alert-info small">${FormattedTextTemplate(formattedFeedback)}</div></div>`
        : ``;
}

