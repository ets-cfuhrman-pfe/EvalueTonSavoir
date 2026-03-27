import { TemplateOptions } from './types';
import {FormattedTextTemplate} from './TextTypeTemplate';
import { TextFormat } from 'gift-pegjs';

type GlobalFeedbackOptions = TemplateOptions & TextFormat;

export default function GlobalFeedbackTemplate({ format, text }: GlobalFeedbackOptions): string {
    return (format && text)
        ? `<div class="gift-preview-feedback">
        <p>${FormattedTextTemplate({format: format, text: text})}</p>
      </div>`
        : ``;
}
