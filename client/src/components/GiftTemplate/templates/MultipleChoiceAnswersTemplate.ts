import { nanoid } from 'nanoid';
import { TemplateOptions } from './types';
import {FormattedTextTemplate} from './TextTypeTemplate';
import AnswerIcon from './AnswerIconTemplate';
import { state } from '.';
import { ParagraphStyle } from '../constants';
import { MultipleChoiceQuestion, TextChoice } from 'gift-pegjs';

type MultipleChoiceAnswerOptions = TemplateOptions & Pick<MultipleChoiceQuestion, 'choices'>;

type AnswerFeedbackOptions = TemplateOptions & Pick<TextChoice, 'formattedFeedback'>;

interface AnswerWeightOptions extends TemplateOptions {
    weight: TextChoice['weight'];
}

export default function MultipleChoiceAnswersTemplate({ choices }: MultipleChoiceAnswerOptions) {
    const id = `id${nanoid(8)}`;

    const isMultipleAnswer = choices.filter(({ isCorrect }) => isCorrect === true).length != 0;

    const prompt = `<span style="${ParagraphStyle(state.theme)}">Choisir une réponse${
        isMultipleAnswer ? ` ou plusieurs` : ``
    }:</span>`;
    const result = choices
        .map(({ weight, isCorrect, formattedText, formattedFeedback }) => {
            const CustomLabel = `
          display: inline-block;
          padding: 0.2em 0 0.2em 0;
        `;

            const inputId = `id${nanoid(6)}`;

            const isPositiveWeight = (weight != undefined) && (weight > 0);
            const isCorrectOption = isMultipleAnswer ? isPositiveWeight || isCorrect : isCorrect;

            return `
        <div class='multiple-choice-answers-container'>
          <input class="gift-input" type="${
              isMultipleAnswer ? 'checkbox' : 'radio'
          }" id="${inputId}" name="${id}">
          ${AnswerWeight({ weight: weight })}
            <label style="${CustomLabel} ${ParagraphStyle(state.theme)}" for="${inputId}">
            ${FormattedTextTemplate(formattedText)}
            </label>
          ${AnswerIcon({ correct: isCorrectOption })}
          ${AnswerFeedback({ formattedFeedback: formattedFeedback })}
          </input>
        </div>
        `;
        })
        .join('');

    return `${prompt}${result}`;
}

function AnswerWeight({ weight }: AnswerWeightOptions): string {
    return weight ? `<span class="answer-weight-container ${weight > 0 ? 'answer-positive-weight' : 'answer-zero-or-less-weight'}">${weight}%</span>` : ``;
}

function AnswerFeedback({ formattedFeedback }: AnswerFeedbackOptions): string {
    return formattedFeedback ? `<span class="feedback-container">${FormattedTextTemplate(formattedFeedback)}</span>` : ``;
}
