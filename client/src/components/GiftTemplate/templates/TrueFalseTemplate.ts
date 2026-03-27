import { TemplateOptions } from './types';
import QuestionContainer from './QuestionContainerTemplate';
import GlobalFeedback from './GlobalFeedbackTemplate';
import Title from './TitleTemplate';
import { TrueFalseQuestion } from 'gift-pegjs';
import StemTemplate from './StemTemplate';
import { FormattedTextTemplate } from './TextTypeTemplate';

type TrueFalseOptions = TemplateOptions & TrueFalseQuestion;

export default function TrueFalseTemplate({
    isTrue,
    title,
    formattedStem,
    trueFormattedFeedback, falseFormattedFeedback,
    formattedGlobalFeedback
}: TrueFalseOptions): string {
    const trueClass = isTrue ? 'bg-success text-white' : 'bg-danger text-white';
    const falseClass = isTrue ? 'bg-danger text-white' : 'bg-success text-white';

    const choices = `
        <div class="row g-3">
          <div class="col-6">
            <div class="w-100 p-3 d-flex align-items-center choice-button ${trueClass}">
              <div class="d-flex align-items-center choice-button-content flex-grow-1">
                <strong>Vrai</strong>
              </div>
            </div>
            ${trueFormattedFeedback ? `<div class="true-feedback"><div>${FormattedTextTemplate(trueFormattedFeedback)}</div></div>` : ''}
          </div>
          <div class="col-6">
            <div class="w-100 p-3 d-flex align-items-center choice-button ${falseClass}">
              <div class="d-flex align-items-center choice-button-content flex-grow-1">
                <strong>Faux</strong>
              </div>
            </div>
            ${falseFormattedFeedback ? `<div class="false-feedback"><div>${FormattedTextTemplate(falseFormattedFeedback)}</div></div>` : ''}
          </div>
        </div>
    `;

    return `${QuestionContainer({
        extraClass: 'true-false-question',
        children: [
            Title({
                type: 'Vrai/Faux',
                title: title
            }),
            StemTemplate({formattedStem}),
            choices,
            formattedGlobalFeedback ? GlobalFeedback(formattedGlobalFeedback) : ``
        ]
    })}`;
}

