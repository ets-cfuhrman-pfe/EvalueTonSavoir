import { render } from '@testing-library/react';
import { MultipleChoice } from '../../../../components/GiftTemplate/templates';
import { TemplateOptions, MultipleChoice as MultipleChoiceType } from '../../../../components/GiftTemplate/templates/types';

const mockProps: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    stem: { format: 'plain' , text: 'Sample Stem'},
    choices: [
        { text: { format: 'plain' , text: 'Choice 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'plain', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    globalFeedback:  { format: 'plain', text: 'Sample Global Feedback' } 
};

const katekMock: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    stem: { format: 'plain' , text: '$$\\frac{zzz}{yyy}$$'},
    choices: [
        { text: { format: 'plain' , text: 'Choice 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'plain', text: 'Choice 2' }, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 }
    ],
    globalFeedback:  { format: 'plain', text: 'Sample Global Feedback' } 
};

const imageMock: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    stem: { format: 'plain', text: 'Sample Stem with Image' },
    choices: [
        { text: { format: 'plain', text: 'Choice 1' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { text: { format: 'plain', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { text: { format: 'plain', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, feedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback with Image' }
};

const mockMoodle: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    stem: { format: 'moodle' , text: 'Sample Stem'},
    choices: [
        { text: { format: 'moodle' , text: 'Choice 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'plain', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    globalFeedback:  { format: 'plain', text: 'Sample Global Feedback' } 
};


const mockHTML: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title',
    stem: { format: 'html' , text: '$$\\frac{zzz}{yyy}$$'},
    choices: [
        { text: { format: 'html' , text: 'Choice 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'html', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain' , text: 'InCorrect!'}, weight: 1 }
    ],
    globalFeedback:  { format: 'html', text: 'Sample Global Feedback' } 
};

const mockMarkdown: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    stem: { format: 'markdown', text: 'Sample Stem with Image' },
    choices: [
        { text: { format: 'markdown', text: 'Choice 1' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { text: { format: 'markdown', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { text: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, feedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    globalFeedback: { format: 'markdown', text: 'Sample Global Feedback with Image' }
};

const mockMarkdownTwoImages: TemplateOptions & MultipleChoiceType = {
    type: 'MC',
    hasEmbeddedAnswers: false,
    title: 'Sample Title with Image',
    stem: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt = "Sample Image"/>' },
    choices: [
        { text: { format: 'markdown', text: 'Choice 1' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { text: { format: 'markdown', text: 'Choice 2' }, isCorrect: false, feedback: { format: 'plain', text: 'Incorrect!' }, weight: 1 },
        { text: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: false, feedback: { format: 'plain', text: 'Image Feedback' }, weight: 1 }
    ],
    globalFeedback: { format: 'markdown', text: 'Sample Global Feedback with Image' }
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