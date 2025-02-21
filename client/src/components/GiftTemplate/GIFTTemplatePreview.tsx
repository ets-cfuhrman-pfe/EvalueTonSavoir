// GIFTTemplatePreview.tsx
import React, { useEffect, useState } from 'react';
import Template, { ErrorTemplate, UnsupportedQuestionTypeError } from './templates';
import { parse } from 'gift-pegjs';
import './styles.css';
import { FormattedTextTemplate } from './templates/TextTypeTemplate';

interface GIFTTemplatePreviewProps {
    questions: string[];
    hideAnswers?: boolean;
}

const GIFTTemplatePreview: React.FC<GIFTTemplatePreviewProps> = ({
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
                    previewHTML += `<div label="error-message">${errorMsg}</div>`;
                }
            });

            if (hideAnswers) {
                const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
                previewHTML = previewHTML.replace(svgRegex, '');
                const placeholderRegex = /(placeholder=")[^"]*(")/gi;
                previewHTML = previewHTML.replace(placeholderRegex, '$1$2');
            }

            setItems(previewHTML);
            setIsPreviewReady(true);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Une erreur est survenue durant le chargement de la prévisualisation.');
            }
        }
    }, [questions]);

    const PreviewComponent = () => (
        <React.Fragment>
            {error ? (
                <div className="error">{error}</div>
            ) : isPreviewReady ? (
                <div data-testid="preview-container">

                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: items }) }}></div>
                </div>
            ) : (
                <div className="loading">Chargement de la prévisualisation...</div>
            )}
        </React.Fragment>
    );

    return <PreviewComponent />;
};

export default GIFTTemplatePreview;
