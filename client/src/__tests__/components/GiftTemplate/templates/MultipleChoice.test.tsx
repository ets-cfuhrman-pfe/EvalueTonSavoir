import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MultipleChoice } from 'src/components/GiftTemplate/templates';
import { TemplateOptions } from 'src/components/GiftTemplate/templates/types';
import { MultipleChoiceQuestion } from 'gift-pegjs';

// Mock the nanoid function
jest.mock('nanoid', () => ({
    nanoid: jest.fn(() => 'mocked-id')
  }));

const mockProps: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    formattedStem: { format: 'plain' , text: 'Sample Stem'},
    choices: [
        { formattedText: { format: 'plain' , text: 'Choice 1'}, isCorrect: true, formattedFeedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { formattedText: { format: 'plain', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    formattedGlobalFeedback:  { format: 'plain', text: 'Sample Global Feedback' } 
};

const katekMock: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    formattedStem: { format: 'plain' , text: '$$\\frac{zzz}{yyy}$$'},
    choices: [
        { formattedText: { format: 'plain' , text: 'Choice 1'}, isCorrect: true, formattedFeedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { formattedText: { format: 'plain', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain' , text: 'Correct!'}, weight: 0 }
    ],
    formattedGlobalFeedback:   { format: 'plain', text: 'Sample Global Feedback' } 
};

const imageMock: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    formattedStem: { format: 'plain', text: 'Sample Stem with Image' },
    choices: [
        { formattedText: { format: 'plain', text: 'Choice 1' }, isCorrect: true, formattedFeedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { formattedText: { format: 'plain', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { formattedText: { format: 'plain', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    formattedGlobalFeedback:  { format: 'plain', text: 'Sample Global Feedback with Image' }
};

const mockMoodle: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    formattedStem: { format: 'moodle' , text: 'Sample Stem'},
    choices: [
        { formattedText: { format: 'moodle' , text: 'Choice 1'}, isCorrect: true, formattedFeedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { formattedText: { format: 'plain', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    formattedGlobalFeedback:   { format: 'plain', text: 'Sample Global Feedback' } 
};


const mockHTML: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    formattedStem: { format: 'html' , text: '$$\\frac{zzz}{yyy}$$'},
    choices: [
        { formattedText: { format: 'html' , text: 'Choice 1'}, isCorrect: true, formattedFeedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { formattedText: { format: 'html', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    formattedGlobalFeedback:   { format: 'html', text: 'Sample Global Feedback' } 
};

const mockMarkdown: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    formattedStem: { format: 'markdown', text: 'Sample Stem with Image' },
    choices: [
        { formattedText: { format: 'markdown', text: 'Choice 1' }, isCorrect: true, formattedFeedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { formattedText: { format: 'markdown', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { formattedText: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    formattedGlobalFeedback:  { format: 'markdown', text: 'Sample Global Feedback with Image' }
};

const mockMarkdownTwoImages: TemplateOptions & MultipleChoiceQuestion = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    formattedStem: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt = "Sample Image"/>' },
    choices: [
        { formattedText: { format: 'markdown', text: 'Choice 1' }, isCorrect: true, formattedFeedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { formattedText: { format: 'markdown', text: 'Choice 2' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { formattedText: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, formattedFeedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    formattedGlobalFeedback:  { format: 'markdown', text: 'Sample Global Feedback with Image' }
};

test('MultipleChoice snapshot test', () => {
    const { asFragment } = render(<MultipleChoice {...mockProps} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with katex', () => {
    const { asFragment } = render(<MultipleChoice {...katekMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with image', () => {
    const { asFragment } = render(<MultipleChoice {...imageMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with Moodle text format', () => {
    const { asFragment } = render(<MultipleChoice {...mockMoodle} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with katex, using html text format', () => {
    const { asFragment } = render(<MultipleChoice {...mockHTML} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with image using markdown text format', () => {
    const { asFragment } = render(<MultipleChoice {...mockMarkdown} />);
    expect(asFragment()).toMatchSnapshot();
});

test('MultipleChoice snapshot test with 2 images using markdown text format', () => {
    const { asFragment } = render(<MultipleChoice {...mockMarkdownTwoImages} />);
    expect(asFragment()).toMatchSnapshot();
});
