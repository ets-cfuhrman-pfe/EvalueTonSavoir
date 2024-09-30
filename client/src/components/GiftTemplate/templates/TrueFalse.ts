import { TemplateOptions, TextChoice, TrueFalse as TrueFalseType } from './types';
import QuestionContainer from './QuestionContainer';
import textType from './TextType';
import GlobalFeedback from './GlobalFeedback';
import MultipleChoiceAnswers from './MultipleChoiceAnswers';
import Title from './Title';
import { ParagraphStyle } from '../constants';
import { state } from '.';

type TrueFalseOptions = TemplateOptions & TrueFalseType;

export default function TrueFalse({
    title,
    isTrue,
    stem,
    trueFeedback: trueFeedback,
    falseFeedback: falseFeedback,
    globalFeedback
}: TrueFalseOptions): string {
    const choices: TextChoice[] = [
        {
            text: {
                format: 'moodle',
                text: 'Vrai'
            },
            isCorrect: isTrue,
            weight: null,
            feedback: isTrue ? trueFeedback : falseFeedback
        },
        {
            text: {
                format: 'moodle',
                text: 'Faux'
            },
            isCorrect: !isTrue,
            weight: null,
            feedback: !isTrue ? trueFeedback : falseFeedback
        }
    ];

    return `${QuestionContainer({
        children: [
            Title({
                type: 'Vrai/Faux',
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
