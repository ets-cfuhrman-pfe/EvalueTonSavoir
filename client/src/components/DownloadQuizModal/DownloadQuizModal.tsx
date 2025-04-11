import React, { useState } from 'react';

import { Dialog, DialogTitle, DialogActions, Button, Tooltip, IconButton } from '@mui/material';
import { FileDownload } from '@mui/icons-material';

import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { parse } from 'gift-pegjs';
import DOMPurify from 'dompurify';
import Template, { ErrorTemplate } from '../GiftTemplate/templates';

interface DownloadQuizModalProps {
    quiz: QuizType;
}

const DownloadQuizModal: React.FC<DownloadQuizModalProps> = ({ quiz }) => {
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
                        previewHTML += ErrorTemplate(giftQuestion, error.message );
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

            console.log('previewHTML:', sanitizedHTML);

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
                    <Button onClick={() => handleDownload('pdf-with-answers')}> PDF avec réponses</Button>
                    <Button onClick={() => handleDownload('pdf-without-answers')}>PDF sans réponses</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DownloadQuizModal;
