import { TemplateOptions } from './types';
import { Question } from 'gift-pegjs';

// Type is string to allow for custom question type text (e,g, "Multiple Choice")
interface TitleOptions extends TemplateOptions {
    type: string;
    title: Question['title'];
}

export default function Title({ type, title }: TitleOptions): string {
    return `
  <div class="gift-preview-title">
    <span>
      ${
          title
              ? `<span class="gift-preview-question-label">${title}</span>`
              : `<span class="gift-preview-question-untitled"><em>(Sans titre)</em></span>`
      }
    </span>
    <span class="gift-preview-type-badge-wrapper">
      <span class="gift-preview-type-badge">${type}</span>
    </span>
  </div>
`;
}
