import { TemplateOptions } from './types';
import { BaseQuestion } from 'gift-pegjs';
import { FormattedTextTemplate } from './TextTypeTemplate';

// Type is string to allow for custom question type text (e,g, "Multiple Choice")
interface StemOptions extends TemplateOptions {
    formattedStem: BaseQuestion['formattedStem'];
}

export default function StemTemplate({ formattedStem }: StemOptions): string {
    return `
  <div class="gift-preview-stem">
    <span>
      <p class="present-question-stem">
                      ${FormattedTextTemplate(formattedStem)}
                  </p>
    </span>
  </div>
`;
}
