import React, { useState } from 'react';

import { Dialog, DialogTitle, DialogActions, Button, Tooltip, IconButton } from '@mui/material';
import { FileDownload, Print } from '@mui/icons-material';

import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

import { parse } from 'gift-pegjs';
import DOMPurify from 'dompurify';
import Template, { ErrorTemplate } from '../GiftTemplate/templates';
import { applyQuestionPrintLayout } from '../GiftTemplate/printLayout';
import { applyHideAnswersMask } from '../GiftTemplate/hideAnswersMask';

interface DownloadQuizModalProps {
    quiz: QuizType;
}

const DownloadQuizModal: React.FC<DownloadQuizModalProps> = ({ quiz }) => {
    const [open, setOpen] = useState(false);

    const handleOpenModal = () => setOpen(true);

    const handleCloseModal = () => setOpen(false);

    const handleDownload = async (format: 'txt' | 'print-with-answers' | 'print-without-answers') => {
        switch (format) {
            case 'txt':
                await downloadTxtFile(quiz);
                break;
            case 'print-with-answers':
                await printQuizFile(quiz, true, globalThis.open('', '_blank', 'width=1024,height=768'));
                break;
            case 'print-without-answers':
                await printQuizFile(quiz, false, globalThis.open('', '_blank', 'width=1024,height=768'));
                break;
        }
        handleCloseModal();
    };

    const downloadTxtFile = async (quiz: QuizType) => {
        try {
            const selectedQuiz = await ApiService.getQuiz(quiz._id) as QuizType;
            if (!selectedQuiz) throw new Error('Quiz not found');

            let quizContent = "";
            selectedQuiz.content.forEach((question) => {
                const formattedQuestion = question.trim();
                if (formattedQuestion !== '') quizContent += formattedQuestion + '\n\n';
            });

            const blob = new Blob([quizContent], { type: 'text/plain' });
            const a = document.createElement('a');
            a.download = `${selectedQuiz.title}.gift`;
            a.href = globalThis.URL.createObjectURL(blob);
            a.click();
        } catch (error) {
            console.error('Error exporting quiz:', error);
        }
    };

    const buildPreviewHtml = (quizData: QuizType, withAnswers: boolean): string => {
        let previewHtml = '';

        quizData.content.forEach((giftQuestion) => {
            try {
                const question = parse(giftQuestion);
                previewHtml += Template(question[0], {
                    preview: true,
                    theme: 'light',
                });
            } catch (error) {
                if (error instanceof Error) {
                    previewHtml += ErrorTemplate(giftQuestion, error.message);
                } else {
                    previewHtml += ErrorTemplate(giftQuestion, 'Erreur inconnue');
                }
            }
        });

        previewHtml = applyQuestionPrintLayout(previewHtml);

        if (!withAnswers) {
            previewHtml = applyHideAnswersMask(previewHtml);
        }

        return previewHtml;
    };

    const createPrintableMarkup = (targetDocument: Document, title: string, sanitizedHtml: string): HTMLElement => {
        const main = targetDocument.createElement('main');
        main.className = 'download-quiz-print';

        const heading = targetDocument.createElement('h1');
        heading.className = 'editor-quiz-print-title';
        heading.textContent = title;

        const previewContainer = targetDocument.createElement('div');
        previewContainer.className = 'preview-container';
        previewContainer.innerHTML = sanitizedHtml;

        main.appendChild(heading);
        main.appendChild(previewContainer);

        return main;
    };

    const cloneCurrentStyles = (targetWindow: Window) => {
        const styleNodes = document.querySelectorAll('link[rel="stylesheet"], style');
        styleNodes.forEach((styleNode) => {
            targetWindow.document.head.appendChild(styleNode.cloneNode(true));
        });
    };

    const waitForImageLoad = (img: HTMLImageElement): Promise<void> => {
        return new Promise<void>((resolve) => {
            if (img.complete) {
                resolve();
                return;
            }

            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
        });
    };

    const waitForImages = async (container: ParentNode): Promise<void> => {
        const images = Array.from(container.querySelectorAll<HTMLImageElement>('img'));
        if (images.length === 0) {
            return;
        }

        await Promise.all(images.map((img) => waitForImageLoad(img)));
    };

    const printQuizFile = async (quiz: QuizType, withAnswers: boolean, printWindow: Window | null) => {
        try {
            if (!printWindow) {
                throw new Error('Unable to open print window');
            }

            const selectedQuiz = await ApiService.getQuiz(quiz._id) as QuizType;
            if (!selectedQuiz) throw new Error('Quiz not found');

            const previewHtml = buildPreviewHtml(selectedQuiz, withAnswers);
            const sanitizedHtml = DOMPurify.sanitize(previewHtml);

            const printDocument = printWindow.document;
            printDocument.documentElement.lang = 'fr';
            printDocument.title = selectedQuiz.title;
            printDocument.body.innerHTML = '';
            printDocument.body.appendChild(createPrintableMarkup(printDocument, selectedQuiz.title, sanitizedHtml));
            cloneCurrentStyles(printWindow);

            await waitForImages(printDocument);

            printWindow.focus();
            printWindow.print();
            printWindow.close();
        } catch (error) {
            console.error('Error printing quiz:', error);
        }
    };

    return (
        <>
            <Tooltip title="Télécharger quiz" placement="top">
                <IconButton color="primary" onClick={handleOpenModal}>
                    <FileDownload />
                </IconButton>
            </Tooltip>

            <Dialog open={open} onClose={handleCloseModal} fullWidth maxWidth="xs">
                <DialogTitle sx={{ textAlign: "center" }}>Choisissez un format de téléchargement</DialogTitle>
                <DialogActions sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
                    <Button onClick={() => handleDownload('txt')}>GIFT</Button>
                    <Button startIcon={<Print />} onClick={() => handleDownload('print-with-answers')}>Imprimer avec réponses</Button>
                    <Button startIcon={<Print />} onClick={() => handleDownload('print-without-answers')}>Imprimer sans réponses</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DownloadQuizModal;
