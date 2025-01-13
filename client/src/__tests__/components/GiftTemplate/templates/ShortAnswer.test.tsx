import { render } from '@testing-library/react';
import ShortAnswer from '../../../../components/GiftTemplate/templates/ShortAnswer';
import { TemplateOptions, ShortAnswer as ShortAnswerType } from '../../../../components/GiftTemplate/templates/types';

const plainTextMock: TemplateOptions & ShortAnswerType = {
    type: 'Short',
    hasEmbeddedAnswers: false,
    title: 'Sample Short Answer Title',
    stem: { format: 'plain', text: 'Sample Stem' },
    choices: [
        { text: { format: 'plain' , text: 'Answer 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'plain' , text: 'Answer 2'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 }
    ],
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback' }
};

const katexMock: TemplateOptions & ShortAnswerType = {
    type: 'Short',
    hasEmbeddedAnswers: false,
    title: 'Sample Short Answer Title',
    stem: { format: 'html', text: '$$\\frac{zzz}{yyy}$$' },
    choices: [
        { text: { format: 'html' , text: 'Answer 1'}, isCorrect: true, feedback: { format: 'html' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'html' , text: 'Answer 2'}, isCorrect: true, feedback: { format: 'moodle' , text: 'Correct!'}, weight: 1 }
    ],
    globalFeedback: { format: 'html', text: 'Sample Global Feedback' }
};

const moodleMock: TemplateOptions & ShortAnswerType = {
    type: 'Short',
    hasEmbeddedAnswers: false,
    title: 'Sample Short Answer Title',
    stem: { format: 'moodle', text: 'Sample Stem' },
    choices: [
        { text: { format: 'moodle' , text: 'Answer 1'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 },
        { text: { format: 'moodle' , text: 'Answer 2'}, isCorrect: true, feedback: { format: 'plain' , text: 'Correct!'}, weight: 1 }
    ],
    globalFeedback: { format: 'moodle', text: 'Sample Global Feedback' }
};

const imageMock: TemplateOptions & ShortAnswerType = {
    type: 'Short',
    hasEmbeddedAnswers: false,
    title: 'Sample Short Answer Title with Image',
    stem: { format: 'markdown', text: 'Sample Stem with Image' },
    choices: [
        { text: { format: 'markdown', text: 'Answer 1' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { text: { format: 'markdown', text: 'Answer 2' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 },
        { text: { format: 'markdown', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' }, isCorrect: true, feedback: { format: 'plain', text: 'Correct!' }, weight: 1 }
    ],
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback with Image' }
};


test('ShortAnswer snapshot test with plain text', () => {
    const { asFragment } = render(<ShortAnswer {...plainTextMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('ShortAnswer snapshot test with katex', () => {
    const { asFragment } = render(<ShortAnswer {...katexMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('ShortAnswer snapshot test with moodle', () => {
    const { asFragment } = render(<ShortAnswer {...moodleMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('ShortAnswer snapshot test with image', () => {
    const { asFragment } = render(<ShortAnswer {...imageMock} />);
    expect(asFragment()).toMatchSnapshot();
});