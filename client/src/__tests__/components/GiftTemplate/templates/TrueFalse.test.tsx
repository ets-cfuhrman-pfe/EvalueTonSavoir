import { render } from '@testing-library/react';
import TrueFalse from '../../../../components/GiftTemplate/templates';
import { TemplateOptions, TrueFalse as TrueFalseType } from '../../../../components/GiftTemplate/templates/types';

const plainTextMock: TemplateOptions & TrueFalseType = {
    type: 'TF',
    hasEmbeddedAnswers: false,
    title: 'Sample True/False Title',
    stem: { format: 'plain', text: 'Sample Stem' },
    isTrue: true,
    trueFeedback: { format: 'plain', text: 'Correct!' },
    falseFeedback: { format: 'plain', text: 'Incorrect!' },
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback' }
};

const katexMock: TemplateOptions & TrueFalseType = {
    type: 'TF',
    hasEmbeddedAnswers: false,
    title: 'Sample True/False Title',
    stem: { format: 'html', text: '$$\\frac{zzz}{yyy}$$' },
    isTrue: true,
    trueFeedback: { format: 'moodle', text: 'Correct!' },
    falseFeedback: { format: 'html', text: 'Incorrect!' },
    globalFeedback: { format: 'markdown', text: 'Sample Global Feedback' }
};

const moodleMock: TemplateOptions & TrueFalseType = {
    type: 'TF',
    hasEmbeddedAnswers: false,
    title: 'Sample True/False Title',
    stem: { format: 'moodle', text: 'Sample Stem' },
    isTrue: true,
    trueFeedback: { format: 'moodle', text: 'Correct!' },
    falseFeedback: { format: 'moodle', text: 'Incorrect!' },
    globalFeedback: { format: 'moodle', text: 'Sample Global Feedback' }
};

const imageMock: TemplateOptions & TrueFalseType = {
    type: 'TF',
    hasEmbeddedAnswers: false,
    title: 'Sample Short Answer Title with Image',
    stem: { format: 'plain', text: 'Sample Stem with Image' },
    trueFeedback: { format: 'moodle', text: 'Correct!' },
    isTrue: true,
    falseFeedback: { format: 'moodle', text: 'Incorrect!' },
    globalFeedback: { format: 'plain', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />'  }
};

test('TrueFalse snapshot test with plain text', () => {
    const { asFragment } = render(<TrueFalse {...plainTextMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('TrueFalse snapshot test with katex', () => {
    const { asFragment } = render(<TrueFalse {...katexMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('TrueFalse snapshot test with moodle', () => {
    const { asFragment } = render(<TrueFalse {...moodleMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('TrueFalse snapshot test with image', () => {
    const { asFragment } = render(<TrueFalse {...imageMock} />);
    expect(asFragment()).toMatchSnapshot();
});