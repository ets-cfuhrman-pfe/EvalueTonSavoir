// GIFTTemplatePreviewV2.tsx
import React, { useEffect, useRef, useState } from 'react';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';
import { buildGiftPreviewHtml } from './buildGiftPreviewHtml';
import { splitGiftBlocks } from '../../utils/giftDiagnostics';

interface GIFTTemplatePreviewV2Props {
    questions: string[];
    hideAnswers?: boolean;
    rawDocument?: string;
    startLineNumbers?: number[];
    onErrorLocationClick?: (lineNumber: number, column: number) => void;
}

const GIFTTemplatePreviewV2: React.FC<GIFTTemplatePreviewV2Props> = ({
    questions,
    hideAnswers = false,
    rawDocument,
    startLineNumbers,
    onErrorLocationClick,
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [items, setItems] = useState('');
    const previewContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            let computedStartLines = startLineNumbers;
            if (!computedStartLines && rawDocument) {
                const blocks = splitGiftBlocks(rawDocument);
                computedStartLines = blocks.map(b => b.startLine);
            }

            const previewHTML = buildGiftPreviewHtml(questions, {
                hideAnswers,
                printLayout: true,
                errorMode: 'preview',
                startLineNumbers: computedStartLines,
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
    }, [questions, hideAnswers, rawDocument, startLineNumbers]);

    useEffect(() => {
        const container = previewContainerRef.current;
        if (!container || !onErrorLocationClick) {
            return;
        }

        const handlePreviewClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const linkElement = target.closest('a[data-gift-error-link="true"]');
            if (!(linkElement instanceof HTMLAnchorElement)) {
                return;
            }

            event.preventDefault();

            const line = Number.parseInt(linkElement.dataset.line || '', 10);
            const column = Number.parseInt(linkElement.dataset.column || '', 10);

            if (Number.isFinite(line) && line > 0) {
                onErrorLocationClick(line, Number.isFinite(column) && column > 0 ? column : 1);
            }
        };

        container.addEventListener('click', handlePreviewClick);

        return () => {
            container.removeEventListener('click', handlePreviewClick);
        };
    }, [onErrorLocationClick]);

    if (error) {
        return <div className="alert alert-danger" role="alert">{error}</div>;
    }

    if (!isPreviewReady) {
        return <div className="text-muted">Chargement de la prévisualisation...</div>;
    }

    return (
        <div data-testid="preview-container" className="preview-container" ref={previewContainerRef}>
            <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: items }) }}></div>
        </div>
    );
};

export default GIFTTemplatePreviewV2;