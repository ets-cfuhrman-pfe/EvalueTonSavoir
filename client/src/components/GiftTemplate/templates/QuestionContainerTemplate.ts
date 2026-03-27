import { TemplateOptions } from './types';

interface ContainerOptions extends TemplateOptions {
    extraClass?: string;
}

export default function QuestionContainer({ children, extraClass }: ContainerOptions): string {
    const classes = extraClass
        ? `gift-preview-question ${extraClass}`
        : 'gift-preview-question';
    return `<section class="${classes}">${
        Array.isArray(children) ? children.join('') : children
    }</section>`;
}

