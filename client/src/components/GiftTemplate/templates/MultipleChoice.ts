import { TemplateOptions, MultipleChoice as MultipleChoiceType } from './types';
import QuestionContainer from './QuestionContainer';
import GlobalFeedback from './GlobalFeedback';
import Title from './Title';
import textType from './TextType';
import MultipleChoiceAnswers from './MultipleChoiceAnswers';
import { ParagraphStyle } from '../constants';
import { state } from '.';

type MultipleChoiceOptions = TemplateOptions & MultipleChoiceType;

export default function MultipleChoice({
    title,
    stem,
    choices,
    globalFeedback
}: MultipleChoiceOptions): string {
    return `${QuestionContainer({
        children: [
            Title({
                type: 'Choix multiple',
                title: title
            }),
            `<p style="${ParagraphStyle(state.theme)}">${textType({
                text: stem
            })}</p>`,
            MultipleChoiceAnswers({ choices: choices }),
            GlobalFeedback({ feedback: globalFeedback })
        ]
    })}`;
}
