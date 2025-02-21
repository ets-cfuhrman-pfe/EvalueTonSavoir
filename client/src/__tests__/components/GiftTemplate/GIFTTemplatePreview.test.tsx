import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GIFTTemplatePreview from 'src/components/GiftTemplate/GIFTTemplatePreview';

describe('GIFTTemplatePreview Component', () => {
  test('renders error message when questions contain invalid syntax', () => {
    render(<GIFTTemplatePreview questions={[':: title']} />);
    const errorMessage = screen.getByText(/Title ::, Category, Description, or Question formatted stem but ":" found./i);
    expect(errorMessage).toBeInTheDocument();
  });

  test('renders preview when valid questions are provided', () => {
    const questions = [
      'Stem1 {=ans1 ~ans2 ~ans3}',
    ];
    render(<GIFTTemplatePreview questions={questions} />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    // const question1 = screen.getByText('Stem1');
    const mcQuestion1 = screen.getByText('Stem1');
    const ans1 = screen.getByText('ans1');
    const ans2 = screen.getByText('ans2');
    const ans3 = screen.getByText('ans3');
    expect(mcQuestion1).toBeInTheDocument();
    expect(ans1).toBeInTheDocument();
    expect(ans2).toBeInTheDocument();
    expect(ans3).toBeInTheDocument();

    // each answer should have a radio button before it
    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
    // ans1 should be the <label> for the first radio button
    expect(radioButtons[0].nextElementSibling).toBe(ans1);
    // ans2 should be the <label> for the second radio button
    expect(radioButtons[1].nextElementSibling).toBe(ans2);
    // ans3 should be the <label> for the third radio button
    expect(radioButtons[2].nextElementSibling).toBe(ans3);

    // after the <label> for correct answer (ans1) there should be an svg with aria-hidden="true"
    expect(ans1.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
    // after the <label> for incorrect answer (ans2) there should be an svg with aria-hidden="true"
    expect(ans2.nextElementSibling).toHaveAttribute('aria-hidden', 'true');
    // after the <label> for incorrect answer (ans3) there should be an svg with aria-hidden="true"
    expect(ans3.nextElementSibling).toHaveAttribute('aria-hidden', 'true');

  });
  test('hides correct/incorrect answers when hideAnswers prop is true', () => {
    const questions = [
      'Stem1 {=ans1 ~ans2 ~ans3}',
    ];
    render(<GIFTTemplatePreview questions={questions} hideAnswers />);
    const previewContainer = screen.getByTestId('preview-container');
    expect(previewContainer).toBeInTheDocument();
    const ans1 = screen.queryByText('ans1');
    const ans2 = screen.queryByText('ans2');
    const ans3 = screen.queryByText('ans3');

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
    expect(radioButtons[0].nextElementSibling).toBe(ans1);
    expect(ans1?.nextElementSibling).toBeNull();
    expect(radioButtons[1].nextElementSibling).toBe(ans2);
    expect(ans2?.nextElementSibling).toBeNull();
    expect(radioButtons[2].nextElementSibling).toBe(ans3);
    expect(ans3?.nextElementSibling).toBeNull();
  });
});
