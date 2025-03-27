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
    hideAnswers = false,
}) => {
    const [error, setError] = useState('');
    const [isPreviewReady, setIsPreviewReady] = useState(false);
    const [questionItems, setQuestionItems] = useState<string[]>([]); // Array of HTML strings for each question

    useEffect(() => {
        try {
            const previewItems: string[] = [];
            questions.forEach((giftQuestion) => {
                try {
                    const question = parse(giftQuestion);
                    const html = Template(question[0], {
                        preview: true,
                        theme: 'light',
                    });
                    previewItems.push(html);
                } catch (error) {
                    let errorMsg: string;
                    if (error instanceof UnsupportedQuestionTypeError) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur: ${error.message}`);
                    } else if (error instanceof Error) {
                        errorMsg = ErrorTemplate(giftQuestion, `Erreur GIFT: ${error.message}`);
                    } else {
                        errorMsg = ErrorTemplate(giftQuestion, 'Erreur inconnue');
                    }
                    previewItems.push(`<div label="error-message">${errorMsg}</div>`);
                }
            });

            if (hideAnswers) {
                previewItems.forEach((item, index) => {
                    const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
                    const placeholderRegex = /(placeholder=")[^"]*(")/gi;
                    previewItems[index] = item
                        .replace(svgRegex, '')
                        .replace(placeholderRegex, '$1$2');
                });
            }

            setQuestionItems(previewItems);
            setIsPreviewReady(true);
        } catch (error: unknown) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Une erreur est survenue durant le chargement de la prévisualisation.');
            }
        }
    }, [questions, hideAnswers]);

    const PreviewComponent = () => (
        <React.Fragment>
            {error ? (
                <div className="error">{error}</div>
            ) : isPreviewReady ? (
                <div data-testid="preview-container">
                    {questionItems.map((item, index) => (
                        <div
                            key={index}
                            className="question-item"
                            dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: 'html', text: item }) }}
                        />
                    ))}
                </div>
            ) : (
                <div className="loading">Chargement de la prévisualisation...</div>
            )}
        </React.Fragment>
    );

    return <PreviewComponent />;
};

export default GIFTTemplatePreview;