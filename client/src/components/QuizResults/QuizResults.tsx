import React from 'react';
import { StudentType } from '../../Types/StudentType';
import { QuestionType } from '../../Types/QuestionType';

interface QuizResultsProps {
    students: StudentType[];
    questions: QuestionType[];
    quizTitle?: string;
    isStudentView?: boolean;
    currentStudent?: StudentType;
}

const QuizResults: React.FC<QuizResultsProps> = ({
    students,
    questions,
    quizTitle,
    isStudentView = false,
    currentStudent
}) => {
    const getStudentGrade = (student: StudentType): { percentage: number; correct: number; total: number } => {
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

    return (
        <div className="container-fluid">
            <div className="row justify-content-center">
                <div className="col-lg-8 col-md-10 col-12">
                    <div className="card shadow-lg mb-4">
                        <div className="card-body text-center py-5">
                            <h1 className="display-4 text-primary fw-bold mb-3">
                                Quiz terminé!
                            </h1>
                            {quizTitle && (
                                <h5 className="text-muted mb-0">
                                    {quizTitle}
                                </h5>
                            )}
                        </div>
                    </div>

                    <div className="card shadow">
                        <div className="card-body">
                            <h5 className="card-title fw-bold mb-4">
                                Résultats finaux
                            </h5>

                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="fw-bold">
                                                {isStudentView ? 'Votre résultat' : 'Étudiant'}
                                            </th>
                                            <th className="text-center fw-bold">
                                                Score (%)
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
    );
};

export default QuizResults;