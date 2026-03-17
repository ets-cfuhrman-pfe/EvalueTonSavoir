// GIFTTemplatePreviewV2.tsx
import React, { useEffect, useState } from 'react';
import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { parse } from 'gift-pegjs';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';

interface GIFTTemplatePreviewV2Props {
    questions: string[];
    hideAnswers?: boolean;
}

function applySideImageLayout(previewHtml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, 'text/html');
    const questionSections = doc.querySelectorAll<HTMLElement>('section.gift-preview-question');

    questionSections.forEach((section) => {
        const stemElement = section.querySelector<HTMLElement>('.present-question-stem');
        if (!stemElement) return;

        const images = Array.from(stemElement.querySelectorAll<HTMLImageElement>('img'));
        if (images.length === 0) return;

        images.forEach((image) => image.remove());

        const layout = doc.createElement('div');
        layout.className = 'side-image-layout';

        const contentColumn = doc.createElement('div');
        contentColumn.className = 'side-image-layout__content';
        while (section.firstChild) {
            contentColumn.appendChild(section.firstChild);
        }

        const imageColumn = doc.createElement('div');
        imageColumn.className = 'side-image-layout__images';
        images.forEach((image, index) => {
            const wrapper = doc.createElement('div');
            wrapper.className = 'side-image-layout__image-wrapper';
            wrapper.dataset.imageIndex = String(index);
            wrapper.appendChild(image);
            imageColumn.appendChild(wrapper);
        });

        layout.appendChild(contentColumn);
        layout.appendChild(imageColumn);
        section.appendChild(layout);
    });

    return doc.body.innerHTML;
}

const GIFTTemplatePreviewV2: React.FC<GIFTTemplatePreviewV2Props> = ({
    questions,
    hideAnswers = false
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [items, setItems] = useState('');

    useEffect(() => {
        try {
            let previewHTML = '';
            questions.forEach((giftQuestion) => {
                try {
                    const question = parse(giftQuestion);
                    previewHTML += Template(question[0], {
                        preview: true,
                        theme: 'light'
                    });
                } catch (error) {
                    let errorMsg: string;
                    if (error instanceof UnsupportedQuestionTypeError) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur: ${error.message}`);
                    } else if (error instanceof Error) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur GIFT: ${error.message}`);
                    } else {
                        errorMsg = ErrorTemplate(giftQuestion, 'Erreur inconnue');
                    }
                    previewHTML += `<div class="alert alert-danger" role="alert">${errorMsg}</div>`;
                }
            });

            if (hideAnswers) {
                const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
                previewHTML = previewHTML.replaceAll(svgRegex, '');
                const placeholderRegex = /(placeholder=")[^"]*(")/gi;
                previewHTML = previewHTML.replaceAll(placeholderRegex, '$1$2');
            }

            previewHTML = applySideImageLayout(previewHTML);

            setItems(previewHTML);
            setIsPreviewReady(true);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Une erreur est survenue durant le chargement de la prévisualisation.');
            }
        }
    }, [questions, hideAnswers]);

    const PreviewComponent = () => {
        if (error) {
            return <div className="alert alert-danger" role="alert">{error}</div>;
        }

        if (!isPreviewReady) {
            return <div className="text-muted">Chargement de la prévisualisation...</div>;
        }

        return (
            <div data-testid="preview-container" className="preview-container">
                <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: items }) }}></div>
            </div>
        );
    };

    return <PreviewComponent />;
};

export default GIFTTemplatePreviewV2;