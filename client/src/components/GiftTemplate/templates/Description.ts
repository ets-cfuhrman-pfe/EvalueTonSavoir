import { TemplateOptions, Description as DescriptionType } from './types';
import QuestionContainer from './QuestionContainer';
import Title from './Title';
import textType from './TextType';
import { ParagraphStyle } from '../constants';
import { state } from '.';

type DescriptionOptions = TemplateOptions & DescriptionType;

export default function Description({ title, stem }: DescriptionOptions): string {
    return `${QuestionContainer({
        children: [
            Title({
                type: 'Description',
                title: title
            }),
            `<p style="${ParagraphStyle(state.theme)}">${textType({
                text: stem
            })}</p>`
        ]
    })}`;
}
