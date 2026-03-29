// GIFTTemplatePreviewV2.tsx
import React, { useEffect, useState } from 'react';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';
import { buildGiftPreviewHtml } from './buildGiftPreviewHtml';
import { splitGiftBlocks } from '../../utils/giftDiagnostics';

interface GIFTTemplatePreviewV2Props {
    questions: string[];
    hideAnswers?: boolean;
    rawDocument?: string;
    startLineNumbers?: number[];
}

const GIFTTemplatePreviewV2: React.FC<GIFTTemplatePreviewV2Props> = ({
    questions,
    hideAnswers = false,
    rawDocument,
    startLineNumbers,
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [items, setItems] = useState('');

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
    }, [questions, hideAnswers]);

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

export default GIFTTemplatePreviewV2;