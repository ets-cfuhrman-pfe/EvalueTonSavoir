import { TemplateOptions } from './types';
import QuestionContainer from './QuestionContainerTemplate';
import Title from './TitleTemplate';
import GlobalFeedback from './GlobalFeedbackTemplate';
import { NumericalAnswer, NumericalQuestion, TextFormat } from 'gift-pegjs';
import { isHighLowNumericalAnswer, isMultipleNumericalAnswer, isRangeNumericalAnswer, isSimpleNumericalAnswer } from 'gift-pegjs/typeGuards';
import StemTemplate from './StemTemplate';
import { FormattedTextTemplate } from './TextTypeTemplate';

type NumericalOptions = TemplateOptions & NumericalQuestion;
type NumericalAnswerOptions = TemplateOptions & Pick<NumericalQuestion, 'choices'>;

export default function NumericalTemplate({
    title,
    formattedStem,
    choices,
    formattedGlobalFeedback
}: NumericalOptions): string {
    return `${QuestionContainer({
        children: [
            Title({
                type: 'Numérique',
                title: title
            }),
            StemTemplate({formattedStem}),
            NumericalAnswers2({ choices: choices }),
            formattedGlobalFeedback ? GlobalFeedback(formattedGlobalFeedback) : ''
        ]
    })}`;
}

function NumericalAnswers2({ choices }: NumericalAnswerOptions): string {

    // for each choice, return a separate <input> for each answer - answer should show weight and feedback
    const answers = choices.map(choice => {
        if (isMultipleNumericalAnswer(choice)) {
            return { answer: Answer(choice.answer), weight: choice.weight, feedback: choice.formattedFeedback };
        } else {
            return { answer: Answer(choice) };
        }
    });

    let result = '<div>';

    answers.forEach(answer => {
        const weight = answer.weight ? 
        `<span class="numerical-answer-weight-container ${answer.weight > 0 ? 'answer-positive-weight' : 'answer-zero-or-less-weight'}">${answer.weight}%</span>` : 
        ''
        result +=
            `<p class="gift-preview-answer-label">Réponse: </p>`
            + `<input class="gift-input gift-preview-input" type="text" placeholder="${answer.answer}">`
            + weight
            + (answer.feedback ? `<div class="feedback-container">${FormattedTextTemplate(answer.feedback)}</div>` : '');
    });

    result += '</div>';

    return result;

}

// function NumericalAnswers({ choices }: NumericalAnswerOptions): string {
//     const placeholder = isMultipleNumericalAnswer(choices[0])
//     ? choices.map(choice => {
//         console.log(JSON.stringify(choice)); 
//         const c = choice as MultipleNumericalAnswer; 
//         return Answer(c.answer, c.formattedFeedback)
//     }).join(', ')
//     : Answer(choices[0]);

//     // TODO return a separate <input> for each answer - answer should show weight and feedback
//     return `
//       <div>
//           <span style="${ParagraphStyle(
//               state.theme
//           )}">Réponse: </span><input class="gift-input" type="text" style="${InputStyle(
//         state.theme
//     )}" placeholder="${placeholder}">
//       </div>
//       `;
// }

function Answer(choice: NumericalAnswer, formattedFeedback?: TextFormat): string {
    const formattedFeedbackString = formattedFeedback ? ` (${FormattedTextTemplate(formattedFeedback)})` : '';
    switch (true) {
        case isSimpleNumericalAnswer(choice):
            return `${choice.number}${formattedFeedbackString}`;
        case isRangeNumericalAnswer(choice):
            return `${choice.number} &plusmn; ${choice.range}${formattedFeedbackString}`;
        case isHighLowNumericalAnswer(choice):
            return `${choice.numberLow}..${choice.numberHigh}${formattedFeedbackString}`;
        default:
            return ``;
    }
}
