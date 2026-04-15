import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GIFTTemplatePreviewV2 from 'src/components/GiftTemplate/GIFTTemplatePreviewV2';

const validQuestions = [
  '::TFTitle::[markdown]Troo statement {TRUE}',
  '::SATitle::[markdown]What is the answer? {=ShortAnswerOne =ShortAnswerTwo}',
  '::MCQTitle::[markdown]MultiChoice question? {=MQAnswerOne ~MQAnswerTwo#feedback####Gen feedback}',
];

const unsupportedQuestions = [
  '::Title::[markdown]Essay {}',
  '::Title::[markdown]Matching {}',
  '::Title::[markdown]Description',
  '$CATEGORY a/b/c'
];

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: jest.fn(),
  });
});

describe('GIFTTemplatePreviewV2 Component', () => {
  it('renders error message when questions contain invalid syntax', () => {
    render(<GIFTTemplatePreviewV2 questions={['T{']} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    const errorMessage = previewContainer.querySelector('.alert.alert-danger');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveTextContent(/Line \d+, column \d+: Expected .+, but .+ found\./);
  });

  it('renders preview when valid questions are provided, including answers, has no errors', () => {
    render(<GIFTTemplatePreviewV2 questions={validQuestions} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    // Print layout is always applied so each rendered question gets the print layout class.
    expect(previewContainer.querySelectorAll('.gift-preview-question--print-layout')).toHaveLength(validQuestions.length);
    // There should be no errors
    const errorMessage = previewContainer.querySelector('.alert.alert-danger');
    expect(errorMessage).not.toBeInTheDocument();
    // Check that some stems and answers are rendered inside the previewContainer
    expect(previewContainer).toHaveTextContent('Troo statement');
    expect(previewContainer).toHaveTextContent('What is the answer?');
    expect(previewContainer).toHaveTextContent('MultiChoice question?');
    expect(previewContainer).toHaveTextContent('Vrai');
    // short answers are stored in a textbox
    const answerInputElements = screen.getAllByRole('textbox');
    const giftInputElements = answerInputElements.filter(element => element.classList.contains('gift-input'));

    expect(giftInputElements).toHaveLength(1);
    expect(giftInputElements[0]).toHaveAttribute('placeholder', 'ShortAnswerOne, ShortAnswerTwo');

    // Correctness is rendered with result-style red/green outlines.
    expect(previewContainer.querySelectorAll('.choice-button.bg-success').length).toBeGreaterThan(0);
    expect(previewContainer.querySelectorAll('.choice-button.bg-danger').length).toBeGreaterThan(0);
 });

 it('hides answers when hideAnswers prop is true', () => {
    render(<GIFTTemplatePreviewV2 questions={validQuestions} hideAnswers={true} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    expect(previewContainer).toHaveTextContent('Troo statement');
    expect(previewContainer).toHaveTextContent('What is the answer?');
    expect(previewContainer).toHaveTextContent('MultiChoice question?');
    expect(previewContainer).toHaveTextContent('Vrai');
    expect(previewContainer).not.toHaveTextContent('ShortAnswerOne');
    expect(previewContainer).not.toHaveTextContent('ShortAnswerTwo');
    // Masked mode removes correctness and feedback markers.
    expect(previewContainer.querySelector('.choice-button.bg-success')).not.toBeInTheDocument();
    expect(previewContainer.querySelector('.choice-button.bg-danger')).not.toBeInTheDocument();
    expect(previewContainer.querySelector('.gift-preview-feedback')).not.toBeInTheDocument();
  });

  it('should indicate in the preview that unsupported GIFT questions are not supported', () => {
    render(<GIFTTemplatePreviewV2 questions={unsupportedQuestions} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    // find all unsupported errors (should be 4)
    const unsupportedMessages = previewContainer.querySelectorAll('.alert.alert-danger');
    expect(unsupportedMessages).toHaveLength(4);
  });

  it('highlights the active question anchor when activeQuestionIndex is provided', () => {
    render(
      <GIFTTemplatePreviewV2
        questions={validQuestions}
        hideAnswers={false}
        activeQuestionIndex={1}
      />
    );

    const previewContainer = screen.getByTestId('preview-container');
    const activeAnchor = previewContainer.querySelector('.gift-preview-question-anchor--active');
    expect(activeAnchor).toBeInTheDocument();
    expect(activeAnchor).toHaveAttribute('data-question-index', '1');
  });

  it('displays correct global line numbers in error messages when questionStartLines are provided', () => {
    render(
      <GIFTTemplatePreviewV2
        questions={['Valid {=answer}', 'T{', '::Q3:: {=answer}']}
        hideAnswers={false}
        questionStartLines={[1, 7, 10]}
      />
    );

    const previewContainer = screen.getByTestId('preview-container');
    const errorMessages = previewContainer.querySelectorAll('.alert.alert-danger');

    expect(errorMessages).toHaveLength(1);
    // The error is in the second question which starts at line 7
    // So the error should show "Line 7" not "Line 1"
    expect(errorMessages[0]).toHaveTextContent('Line 7');
  });

});
