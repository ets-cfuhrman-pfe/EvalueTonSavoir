import { TemplateOptions } from './types';
import {FormattedTextTemplate} from './TextTypeTemplate';
import AnswerIcon from './AnswerIconTemplate';
import { MultipleChoiceQuestion, TextChoice } from 'gift-pegjs';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type MultipleChoiceAnswerOptions = TemplateOptions & Pick<MultipleChoiceQuestion, 'choices'>;

type AnswerFeedbackOptions = TemplateOptions & Pick<TextChoice, 'formattedFeedback'>;

interface AnswerWeightOptions extends TemplateOptions {
    weight: TextChoice['weight'];
}
export default function MultipleChoiceAnswersTemplate({ choices }: MultipleChoiceAnswerOptions) {
    const hasManyCorrectChoices = choices.filter(({ isCorrect }) => isCorrect === true).length > 1;

    const result = choices
        .map(({ weight, isCorrect, formattedText, formattedFeedback }, i) => {
            const isPositiveWeight = (weight != undefined) && (weight > 0);
            const isCorrectOption = hasManyCorrectChoices ? isPositiveWeight || isCorrect : isCorrect;

            const letterClass = isCorrectOption
                ? 'bg-white text-success border-success'
                : 'bg-white text-dark';

            return `
        <div class="mb-3">
          <div class="d-flex align-items-center w-100 p-3 choice-button bg-light text-dark">
            <div class="choice-letter d-flex align-items-center justify-content-center me-3 rounded-circle border ${letterClass}">
              ${ALPHABET[i] ?? i + 1}
            </div>
            <div class="flex-grow-1 choice-button-content">
              ${FormattedTextTemplate(formattedText)}
            </div>
            ${AnswerIcon({ correct: !!isCorrectOption })}
            ${AnswerWeight({ weight: weight })}
          </div>
          ${AnswerFeedback({ formattedFeedback: formattedFeedback })}
        </div>
        `;
        })
        .join('');

    return result;
}

function AnswerWeight({ weight }: AnswerWeightOptions): string {
    return weight ? `<span class="answer-weight-container ${weight > 0 ? 'answer-positive-weight' : 'answer-zero-or-less-weight'}">${weight}%</span>` : ``;
}

function AnswerFeedback({ formattedFeedback }: AnswerFeedbackOptions): string {
    return formattedFeedback
        ? `<div class="mt-2"><div class="alert alert-info small">${FormattedTextTemplate(formattedFeedback)}</div></div>`
        : ``;
}

