import React, { useState } from 'react';
import '../../styles/main.scss';

import { FileDownload } from '@mui/icons-material';

import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parse } from 'gift-pegjs';
import DOMPurify from 'dompurify';
import Template, { ErrorTemplate } from '../GiftTemplate/templates';

interface DownloadQuizModalV2Props {
    quiz: QuizType;
}

const DownloadQuizModalV2: React.FC<DownloadQuizModalV2Props> = ({ quiz }) => {
    const [open, setOpen] = useState(false);

    const handleOpenModal = () => setOpen(true);

    const handleCloseModal = () => setOpen(false);

    const handleDownload = async (format: 'txt' | 'pdf-with-answers' | 'pdf-without-answers') => {
        switch (format) {
            case 'txt':
                await downloadTxtFile(quiz);
                break;
            case 'pdf-with-answers':
                await downloadPdfFile(quiz, true);
                break;
            case 'pdf-without-answers':
                await downloadPdfFile(quiz, false);
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
            a.href = window.URL.createObjectURL(blob);
            a.click();
        } catch (error) {
            console.error('Error exporting quiz:', error);
        }
    };

    const downloadPdfFile = async (quiz: QuizType, withAnswers: boolean) => {
        try {
            const selectedQuiz = await ApiService.getQuiz(quiz._id) as QuizType;
            if (!selectedQuiz) throw new Error('Quiz not found');

            let previewHTML = '<h2>' + selectedQuiz.title + '</h2>';
            selectedQuiz.content.forEach((giftQuestion) => {
                try {
                    const question = parse(giftQuestion);

                    previewHTML += Template(question[0], {
                        preview: true,
                        theme: 'light',
                    });
                } catch (error) {
                    if (error instanceof Error) {
                        previewHTML += ErrorTemplate(giftQuestion, error.message);
                    } else {
                        previewHTML += ErrorTemplate(giftQuestion, 'Erreur inconnue');
                    }
                }
            });

            if (!withAnswers) {
                const svgRegex = /<svg[^>]*>([\s\S]*?)<\/svg>/gi;
                previewHTML = previewHTML.replace(svgRegex, '');
                const placeholderRegex = /(placeholder=")[^"]*(")/gi;
                previewHTML = previewHTML.replace(placeholderRegex, '$1$2');
                const feedbackContainerRegex = /<(div|span)[^>]*class="feedback-container"[^>]*>[\s\S]*?<\/div>/gi;
                previewHTML = previewHTML.replace(feedbackContainerRegex, '');
                const answerClassRegex = /<(div|span)[^>]*class="[^"]*answer[^"]*"[^>]*>[\s\S]*?<\/\1>/gi;
                previewHTML = previewHTML.replace(answerClassRegex, '');
                const bonneReponseRegex = /<p[^>]*>[^<]*bonne réponse[^<]*<\/p>/gi;
                previewHTML = previewHTML.replace(bonneReponseRegex, '');
                const AllAnswersFieldRegex = /<(p|span)[^>]*>\s*Réponse:\s*<\/\1>\s*<input[^>]*>/gi
                previewHTML = previewHTML.replace(AllAnswersFieldRegex, '');
            }

            const sanitizedHTML = DOMPurify.sanitize(previewHTML);

            //console.log('previewHTML:', sanitizedHTML);

            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sanitizedHTML;
            document.body.appendChild(tempDiv);

            // allowTaint and useCORS are set to true to allow cross-origin images to be used in the canvas
            const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, allowTaint: true });

            document.body.removeChild(tempDiv);

            const pdf = new jsPDF('p', 'mm', 'letter');
            const pageWidth = pdf.internal.pageSize.width;
            const pageHeight = pdf.internal.pageSize.height;
            const margin = 10;
            const imgWidth = pageWidth - 2 * margin;

            let yOffset = 0;

            while (yOffset < canvas.height) {
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = canvas.width;
                pageCanvas.height = Math.min(canvas.height - yOffset, (pageHeight - 2 * margin) * (canvas.width / imgWidth));

                const pageCtx = pageCanvas.getContext('2d');
                if (pageCtx) {
                    pageCtx.drawImage(canvas, 0, yOffset, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
                }

                const pageImgData = pageCanvas.toDataURL('image/png');

                if (yOffset > 0) pdf.addPage();

                pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, (pageCanvas.height * imgWidth) / pageCanvas.width);

                yOffset += pageCanvas.height;
            }

            const filename = withAnswers
                ? `${selectedQuiz.title}_avec_reponses.pdf`
                : `${selectedQuiz.title}_sans_reponses.pdf`;

            pdf.save(filename);
        } catch (error) {
            console.error('Error exporting quiz as PDF:', error);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleOpenModal}
                title="Télécharger quiz"
            >
                <FileDownload fontSize="small" />
            </button>
        );
    }

    return (
        <>
            <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={handleOpenModal}
                title="Télécharger quiz"
            >
                <FileDownload fontSize="small" />
            </button>

            <div className="modal show d-block bg-dark bg-opacity-50">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Choisissez un format de téléchargement</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={handleCloseModal}
                            ></button>
                        </div>
                        <div className="modal-body text-center">
                            <div className="d-grid gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary"
                                    onClick={() => handleDownload('txt')}
                                >
                                    GIFT (.txt)
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-success"
                                    onClick={() => handleDownload('pdf-with-answers')}
                                >
                                    PDF avec réponses
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-warning"
                                    onClick={() => handleDownload('pdf-without-answers')}
                                >
                                    PDF sans réponses
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DownloadQuizModalV2;