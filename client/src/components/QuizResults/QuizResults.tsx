import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Student } from '../../Types/StudentType';
import { QuestionType } from '../../Types/QuestionType';

interface QuizResultsProps {
    students: Student[];
    questions: QuestionType[];
    quizTitle?: string;
    isStudentView?: boolean;
    currentStudent?: Student;
    isOpen?: boolean;
    onClose?: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
    students,
    questions,
    quizTitle,
    isStudentView = false,
    currentStudent,
    isOpen = false,
    onClose
}) => {
    const getStudentGrade = (student: Student): { percentage: number; correct: number; total: number } => {
        if (student.answers.length === 0) {
            return { percentage: 0, correct: 0, total: questions.length };
        }

        const uniqueQuestions = new Set();
        let correctAnswers = 0;

        for (const answer of student.answers) {
            const { idQuestion, isCorrect } = answer;

            if (!uniqueQuestions.has(idQuestion)) {
                uniqueQuestions.add(idQuestion);

                if (isCorrect) {
                    correctAnswers++;
                }
            }
        }

        return {
            percentage: Math.round((correctAnswers / questions.length) * 100),
            correct: correctAnswers,
            total: questions.length
        };
    };

    // For student view, only show current student's result
    const displayStudents = isStudentView && currentStudent ? [currentStudent] : students;

    if (!isOpen) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            className="quiz-results-dialog"
        >
            <DialogTitle className="quiz-results-title">
                Résultats du Quiz
                <IconButton
                    aria-label="Close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent className="quiz-results-content">
                <div className="container-fluid">
                    <div className="row justify-content-center">
                        <div className="col-lg-12 col-md-12 col-12">
                            <div className="card shadow-lg mb-4">
                                <div className="card-body text-center py-4">
                                    <h2 className="display-6 text-primary fw-bold mb-2">
                                        Quiz terminé!
                                    </h2>
                                    {quizTitle && (
                                        <p className="text-muted mb-0 fw-semibold">
                                            {quizTitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="card shadow">
                                <div className="card-body">
                                    <h5 className="card-title fw-bold mb-4">
                                        Résultat
                                    </h5>

                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th className="fw-bold">
                                                        Nom
                                                    </th>
                                                    <th className="text-center fw-bold">
                                                        %
                                                    </th>
                                                    <th className="text-center fw-bold">
                                                        Correct / Total
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayStudents.map((student) => {
                                                    const grade = getStudentGrade(student);
                                                    return (
                                                        <tr key={student.id}>
                                                            <td>
                                                                {isStudentView ? currentStudent?.name || 'Vous' : student.name}
                                                            </td>
                                                            <td className="text-center fw-bold">
                                                                {grade.percentage}%
                                                            </td>
                                                            <td className="text-center">
                                                                {grade.correct} / {grade.total}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
            <DialogActions className="quiz-results-actions">
                <Button onClick={onClose} variant="contained" color="secondary">
                    Fermer
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default QuizResults;