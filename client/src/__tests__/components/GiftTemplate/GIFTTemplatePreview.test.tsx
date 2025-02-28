import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

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

describe('GIFTTemplatePreview Component', () => {
  it('renders error message when questions contain invalid syntax', () => {
    render(<GIFTTemplatePreview questions={['T{']} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    const errorMessage = previewContainer.querySelector('div[label="error-message"]');
    expect(errorMessage).toBeInTheDocument();
  });

  it('renders preview when valid questions are provided, including answers, has no errors', () => {
    render(<GIFTTemplatePreview questions={validQuestions} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    // Check that all question titles are rendered inside the previewContainer
    validQuestions.forEach((question) => {
      const title = question.split('::')[1].split('::')[0];
      expect(previewContainer).toHaveTextContent(title);
    });
    // There should be no errors
    const errorMessage = previewContainer.querySelector('div[label="error-message"]');
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

    // Check for correct answer icon just after MQAnswerOne
    const mqAnswerOneElement = screen.getByText('MQAnswerOne');
    const correctAnswerIcon = mqAnswerOneElement.parentElement?.querySelector('[data-testid="correct-icon"]');
    expect(correctAnswerIcon).toBeInTheDocument();

    // Check for incorrect answer icon just after MQAnswerTwo
    const mqAnswerTwoElement = screen.getByText('MQAnswerTwo');
    const incorrectAnswerIcon = mqAnswerTwoElement.parentElement?.querySelector('[data-testid="incorrect-icon"]');
    expect(incorrectAnswerIcon).toBeInTheDocument();
 });

 it('hides answers when hideAnswers prop is true', () => {
    render(<GIFTTemplatePreview questions={validQuestions} hideAnswers={true} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    expect(previewContainer).toHaveTextContent('Troo statement');
    expect(previewContainer).toHaveTextContent('What is the answer?');
    expect(previewContainer).toHaveTextContent('MultiChoice question?');
    expect(previewContainer).toHaveTextContent('Vrai');
    expect(previewContainer).not.toHaveTextContent('ShortAnswerOne');
    expect(previewContainer).not.toHaveTextContent('ShortAnswerTwo');
    // shouldn't have correct/incorrect icons
    const correctAnswerIcon = screen.queryByTestId('correct-icon');
    expect(correctAnswerIcon).not.toBeInTheDocument();
    const incorrectAnswerIcon = screen.queryByTestId('incorrect-icon');
    expect(incorrectAnswerIcon).not.toBeInTheDocument();
  });

  it('should indicate in the preview that unsupported GIFT questions are not supported', () => {
    render(<GIFTTemplatePreview questions={unsupportedQuestions} hideAnswers={false} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    // find all unsupported errors (should be 4)
    const unsupportedMessages = previewContainer.querySelectorAll('div[label="error-message"]');
    expect(unsupportedMessages).toHaveLength(4);
  });

});
