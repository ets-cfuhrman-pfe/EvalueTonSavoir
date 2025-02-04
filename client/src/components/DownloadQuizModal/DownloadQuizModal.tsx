import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogActions, Button, Tooltip, IconButton } from '@mui/material';
import { FileDownload } from '@mui/icons-material';

import { QuizType } from '../../Types/QuizType';
import ApiService from '../../services/ApiService';

import jsPDF from 'jspdf';

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

            const doc = new jsPDF();
            doc.setFont("helvetica", "bold");
            doc.setFontSize(25);
            doc.text(selectedQuiz.title, 10, 15);

            let yPosition = 40;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(16);

            selectedQuiz.content.forEach((question, index) => {
                let formattedQuestion = question.trim();


                if (!withAnswers) {
                    formattedQuestion = formattedQuestion.replace(/::.*?::/g, '')
                                                        .replace(/\/\/.*$/gm, '')
                                                        .replace(/#[^\n]*/g, '')
                                                        .replace(/=/g, '')
                                                        .replace(/~/g, '')
                                                        .replace(/\{(.*?)\}/g, '{$1}');
                }

                const wrappedText = doc.splitTextToSize(`${index + 1}. ${formattedQuestion}`, 180);

                doc.text(wrappedText, 10, yPosition);

                yPosition += wrappedText.length * 10;
            });

            const filename = withAnswers
                ? `${selectedQuiz.title}_avec_reponses.pdf`
                : `${selectedQuiz.title}_sans_reponses.pdf`;

            doc.save(filename);
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
