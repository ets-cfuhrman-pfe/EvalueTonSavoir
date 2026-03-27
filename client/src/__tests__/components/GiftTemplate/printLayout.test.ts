import { applyQuestionPrintLayout } from 'src/components/GiftTemplate/printLayout';

function parseHtml(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
}

describe('applyQuestionPrintLayout', () => {
    it('applies print layout class, removes titles, and injects numbering in stem order', () => {
        const input = `
            <section class="gift-preview-question">
                <h3 class="gift-preview-title">Title 1</h3>
                <div class="present-question-stem">First question stem</div>
            </section>
            <section class="gift-preview-question">
                <h3 class="gift-preview-title">Title 2</h3>
                <div class="present-question-stem">Second question stem</div>
            </section>
        `;

        const result = applyQuestionPrintLayout(input);
        const resultDoc = parseHtml(result);
        const sections = resultDoc.querySelectorAll<HTMLElement>('section.gift-preview-question');

        expect(sections).toHaveLength(2);
        sections.forEach((section) => {
            expect(section.classList.contains('gift-preview-question--print-layout')).toBe(true);
            expect(section.querySelector('.gift-preview-title')).toBeNull();
            expect(section.querySelector('.side-image-layout')).not.toBeNull();
            expect(section.querySelector('.side-image-layout__content')).not.toBeNull();
        });

        const firstNumber = sections[0].querySelector('.present-question-stem .question-inline-number');
        const secondNumber = sections[1].querySelector('.present-question-stem .question-inline-number');
        expect(firstNumber?.textContent).toBe('1. ');
        expect(secondNumber?.textContent).toBe('2. ');
    });

    it('keeps numbering and layout when title is absent', () => {
        const input = `
            <section class="gift-preview-question">
                <div class="present-question-stem">Question without title</div>
            </section>
        `;

        const resultDoc = parseHtml(applyQuestionPrintLayout(input));
        const section = resultDoc.querySelector<HTMLElement>('section.gift-preview-question');
        const stem = section?.querySelector('.present-question-stem');

        expect(section).not.toBeNull();
        expect(section?.querySelector('.gift-preview-title')).toBeNull();
        expect(stem?.querySelector('.question-inline-number')?.textContent).toBe('1. ');
    });

    it('moves a single image into the image column and marks with-image layout', () => {
        const input = `
            <section class="gift-preview-question">
                <div class="present-question-stem">Stem with image</div>
                <img src="https://example.com/question.png" alt="question visual" />
            </section>
        `;

        const resultDoc = parseHtml(applyQuestionPrintLayout(input));
        const section = resultDoc.querySelector<HTMLElement>('section.gift-preview-question');
        const layout = section?.querySelector<HTMLElement>('.side-image-layout');
        const wrappedImage = section?.querySelector<HTMLImageElement>('.side-image-layout__images .side-image-layout__image-wrapper img');
        const contentImages = section?.querySelectorAll('.side-image-layout__content img');

        expect(layout?.classList.contains('side-image-layout--with-image')).toBe(true);
        expect(wrappedImage).not.toBeNull();
        expect(wrappedImage?.getAttribute('src')).toBe('https://example.com/question.png');
        expect(contentImages).toHaveLength(0);
    });

    it('does not create image column when there is no image', () => {
        const input = `
            <section class="gift-preview-question">
                <div class="present-question-stem">Stem only</div>
                <div class="answer-block">Answer block</div>
            </section>
        `;

        const resultDoc = parseHtml(applyQuestionPrintLayout(input));
        const section = resultDoc.querySelector<HTMLElement>('section.gift-preview-question');
        const layout = section?.querySelector<HTMLElement>('.side-image-layout');

        expect(layout).not.toBeNull();
        expect(layout?.classList.contains('side-image-layout--with-image')).toBe(false);
        expect(section?.querySelector('.side-image-layout__images')).toBeNull();
    });

    it('relocates only the first image to image column and keeps additional images in content', () => {
        const input = `
            <section class="gift-preview-question">
                <div class="present-question-stem">Stem with multiple images</div>
                <img src="https://example.com/first.png" alt="first visual" />
                <img src="https://example.com/second.png" alt="second visual" />
            </section>
        `;

        const resultDoc = parseHtml(applyQuestionPrintLayout(input));
        const section = resultDoc.querySelector<HTMLElement>('section.gift-preview-question');
        const imageColumnImage = section?.querySelector<HTMLImageElement>('.side-image-layout__images img');
        const contentImages = section?.querySelectorAll<HTMLImageElement>('.side-image-layout__content img');

        expect(imageColumnImage?.getAttribute('src')).toBe('https://example.com/first.png');
        expect(contentImages).toHaveLength(1);
        expect(contentImages?.[0].getAttribute('src')).toBe('https://example.com/second.png');
    });
});
