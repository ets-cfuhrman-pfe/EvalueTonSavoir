// GIFTTemplatePreviewV2.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';
import { buildGiftPreviewHtml } from './buildGiftPreviewHtml';

interface GIFTTemplatePreviewV2Props {
    questions: string[];
    hideAnswers?: boolean;
    activeQuestionIndex?: number | null;
}

const GIFTTemplatePreviewV2: React.FC<GIFTTemplatePreviewV2Props> = ({
    questions,
    hideAnswers = false,
    activeQuestionIndex = null,
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [items, setItems] = useState('');
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const lastScrolledIndexRef = useRef<number | null>(null);

    useEffect(() => {
        try {
            const previewHTML = buildGiftPreviewHtml(questions, {
                hideAnswers,
                printLayout: true,
                errorMode: 'preview',
            });

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

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        const anchors = container.querySelectorAll<HTMLElement>('.gift-preview-question-anchor');
        anchors.forEach((anchor) => anchor.classList.remove('gift-preview-question-anchor--active'));

        if (activeQuestionIndex === null || activeQuestionIndex < 0) {
            lastScrolledIndexRef.current = null;
            return;
        }

        const target = container.querySelector<HTMLElement>(
            `.gift-preview-question-anchor[data-question-index="${activeQuestionIndex}"]`
        );

        if (!target) {
            lastScrolledIndexRef.current = null;
            return;
        }

        target.classList.add('gift-preview-question-anchor--active');

        if (lastScrolledIndexRef.current === activeQuestionIndex) {
            return;
        }

        const scrollParent = container.closest('.editor-preview-scroll-area');
        if (scrollParent) {
            const parentRect = scrollParent.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            // Scroll only the preview container by the difference in position, minus a little padding
            const offset = targetRect.top - parentRect.top;
            
            scrollParent.scrollBy({
                top: offset - 16, // 16px padding
                behavior: 'smooth'
            });
        } else {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
        
        lastScrolledIndexRef.current = activeQuestionIndex;
    }, [activeQuestionIndex, items]);

    if (error) {
        return <div className="alert alert-danger" role="alert">{error}</div>;
    }

    if (!isPreviewReady) {
        return <div className="text-muted">Chargement de la prévisualisation...</div>;
    }

    return (
        <div ref={previewContainerRef} data-testid="preview-container" className="preview-container">
            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: items }) }}></div>
        </div>
    );
};

export default GIFTTemplatePreviewV2;