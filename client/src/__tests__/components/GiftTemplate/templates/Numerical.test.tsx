import { render } from '@testing-library/react';
import Numerical from '../../../../components/GiftTemplate/templates/Numerical';
import { TemplateOptions, Numerical as NumericalType } from '../../../../components/GiftTemplate/templates/types';

const plainTextMock: TemplateOptions & NumericalType = {
    type: 'Numerical',
    hasEmbeddedAnswers: false,
    title: 'Sample Numerical Title',
    stem: { format: 'plain', text: 'Sample Stem' },
    choices: [
        { isCorrect: true, weight: 1, text: { type: 'simple', number: 42}, feedback: { format: 'plain', text: 'Correct!' } },
        { isCorrect: false, weight: 1, text: { type: 'simple', number: 43}, feedback: { format: 'plain', text: 'Incorrect!' } }
    ],
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback' }
};

const htmlMock: TemplateOptions & NumericalType = {
    type: 'Numerical',
    hasEmbeddedAnswers: false,
    title: 'Sample Numerical Title',
    stem: { format: 'html', text: '$$\\frac{zzz}{yyy}$$' },
    choices: [
        { isCorrect: true, weight: 1, text: { type: 'simple', number: 42}, feedback: { format: 'html', text: 'Correct!' } },
        { isCorrect: false, weight: 1, text: { type: 'simple', number: 43}, feedback: { format: 'html', text: 'Incorrect!' } }
    ],
    globalFeedback: { format: 'html', text: 'Sample Global Feedback' }
};

const moodleMock: TemplateOptions & NumericalType = {
    type: 'Numerical',
    hasEmbeddedAnswers: false,
    title: 'Sample Numerical Title',
    stem: { format: 'moodle', text: 'Sample Stem' },
    choices: [
        { isCorrect: true, weight: 1, text: { type: 'simple', number: 42}, feedback: { format: 'moodle', text: 'Correct!' } },
        { isCorrect: false, weight: 1, text: { type: 'simple', number: 43}, feedback: { format: 'moodle', text: 'Incorrect!' } }
    ],
    globalFeedback: { format: 'moodle', text: 'Sample Global Feedback' }
};

const imageMock: TemplateOptions & NumericalType = {
    type: 'Numerical',
    hasEmbeddedAnswers: false,
    title: 'Sample Numerical Title with Image',
    stem: { format: 'plain', text: 'Sample Stem with Image' },
    choices: [
        { isCorrect: true, weight: 1, text: { type: 'simple', number: 42}, feedback: { format: 'plain', text: 'Correct!' } },
        { isCorrect: false, weight: 1, text: { type: 'simple', number: 43}, feedback: { format: 'plain', text: 'Incorrect!' } },
        { isCorrect: false, weight: 1, text: { type: 'simple', number: 44}, feedback: { format: 'plain', text: '<img src="https://via.placeholder.com/150" alt="Sample Image" />' } }
    ],
    globalFeedback: { format: 'plain', text: 'Sample Global Feedback with Image' }
};

test('Numerical snapshot test with plain text', () => {
    const { asFragment } = render(<Numerical {...plainTextMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('Numerical snapshot test with html', () => {
    const { asFragment } = render(<Numerical {...htmlMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('Numerical snapshot test with moodle', () => {
    const { asFragment } = render(<Numerical {...moodleMock} />);
    expect(asFragment()).toMatchSnapshot();
});

test('Numerical snapshot test with image', () => {
    const { asFragment } = render(<Numerical {...imageMock} />);
    expect(asFragment()).toMatchSnapshot();
});