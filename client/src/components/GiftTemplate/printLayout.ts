const QUESTION_SELECTOR = 'section.gift-preview-question';

function removeLeadingStemSeparators(stemElement: HTMLElement): void {
    // When an image is removed from the stem, leading <br> or empty wrappers can
    // remain and push the actual stem text to the next line.
    while (stemElement.firstChild) {
        const firstNode = stemElement.firstChild;

        if (firstNode.nodeType === Node.TEXT_NODE) {
            if ((firstNode.textContent ?? '').trim() === '') {
                firstNode.remove();
                continue;
            }

            break;
        }

        if (firstNode.nodeType !== Node.ELEMENT_NODE) {
            break;
        }

        const firstElement = firstNode as HTMLElement;
        const tagName = firstElement.tagName.toLowerCase();

        if (tagName === 'br') {
            firstElement.remove();
            continue;
        }

        const isEmptyWrapper =
            ['p', 'div', 'span'].includes(tagName)
            && (firstElement.textContent ?? '').trim() === ''
            && firstElement.querySelector('img, video, iframe, svg, canvas, object') === null;

        if (isEmptyWrapper) {
            firstElement.remove();
            continue;
        }

        break;
    }
}

export function applyQuestionPrintLayout(previewHtml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, 'text/html');
    const questionSections = doc.querySelectorAll<HTMLElement>(QUESTION_SELECTOR);

    questionSections.forEach((section, index) => {
        const titleElement = section.querySelector<HTMLElement>('.gift-preview-title');
        if (titleElement) {
            titleElement.remove();
        }

        const stemElement = section.querySelector<HTMLElement>('.present-question-stem');
        const image = section.querySelector<HTMLImageElement>('img');

        if (image) {
            image.remove();
        }

        if (stemElement) {
            removeLeadingStemSeparators(stemElement);

            const numberPrefix = doc.createElement('span');
            numberPrefix.className = 'question-inline-number';
            numberPrefix.textContent = `${index + 1}. `;
            stemElement.prepend(numberPrefix);
        }

        section.classList.add('gift-preview-question--print-layout');

        const layout = doc.createElement('div');
        layout.className = image
            ? 'side-image-layout side-image-layout--with-image'
            : 'side-image-layout';

        const contentColumn = doc.createElement('div');
        contentColumn.className = 'side-image-layout__content';
        while (section.firstChild) {
            contentColumn.appendChild(section.firstChild);
        }

        layout.appendChild(contentColumn);

        if (image) {
            const imageColumn = doc.createElement('div');
            imageColumn.className = 'side-image-layout__images';

            const wrapper = doc.createElement('div');
            wrapper.className = 'side-image-layout__image-wrapper';
            wrapper.appendChild(image);
            imageColumn.appendChild(wrapper);

            layout.appendChild(imageColumn);
        }

        section.appendChild(layout);
    });

    return doc.body.innerHTML;
}