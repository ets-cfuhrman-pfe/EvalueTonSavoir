import { TemplateOptions } from './types';
import { state } from '.';
import { theme } from '../constants';
import { Question } from 'gift-pegjs';

// Type is string to allow for custom question type text (e,g, "Multiple Choice")
interface TitleOptions extends TemplateOptions {
    type: string;
    title: Question['title'];
}

export default function Title({ type, title }: TitleOptions): string {
    const Container = `
  display: flex;
  font-weight: bold;
`;

    const QuestionTitle = `
  color: ${theme(state.theme, 'blue', 'gray200')};
  `;

    const OptionalTitle = `
  color: ${theme(state.theme, 'blue', 'gray900')};
`;

    const QuestionTypeContainer = `
  margin-left: auto;
  padding-left: 0.75rem;
  flex: none;
`;

    const QuestionType = `
  box-shadow: 0px 1px 3px ${theme(state.theme, 'gray400', 'black700')};
  padding-left: 0.7rem;
  padding-right: 0.7rem;
  padding-top: 0.4rem;
  padding-bottom: 0.4rem;
  border-radius: 4px;
  background-color: ${theme(state.theme, 'white', 'black400')};
  color: ${theme(state.theme, 'teal700', 'gray300')};
`;

    return `
  <div style="${Container}">
    <span>
      ${
          title
              ? `<span style="${QuestionTitle}">${title}</span>`
              : `<span style="${OptionalTitle}"><em>(Sans titre)</em></span>`
      }
    </span>
    <span style="${QuestionTypeContainer} margin-bottom: 10px;">
      <span style="${QuestionType}">${type}</span>
    </span>
  </div>
`;
}
