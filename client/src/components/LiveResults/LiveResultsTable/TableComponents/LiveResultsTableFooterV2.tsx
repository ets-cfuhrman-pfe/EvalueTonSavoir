import React, { useMemo } from "react";
import { Student } from "../../../../Types/StudentType";

interface LiveResultsTableFooterProps {
    students: Student[];
    maxQuestions: number;
    getStudentGrade: (student: Student) => number;
}

const LiveResultsTableFooterV2: React.FC<LiveResultsTableFooterProps> = ({
    maxQuestions,
    students,
    getStudentGrade
}) => {

    const getCorrectAnswersPerQuestion = (index: number): number => {
        const studentsWhoAnswered = students.filter((student) =>
            student.answers.some(
                (answer) => parseInt(answer.idQuestion.toString()) === index + 1
            )
        );
        
        const studentsWhoGotItCorrect = students.filter((student) =>
            student.answers.some(
                (answer) =>
                    parseInt(answer.idQuestion.toString()) === index + 1 && answer.isCorrect
            )
        );

        if (studentsWhoAnswered.length === 0) {
            return 0;
        }

        return (studentsWhoGotItCorrect.length / studentsWhoAnswered.length) * 100;
    };

    const classAverage: number = useMemo(() => {
        const studentsWithAnswers = students.filter(student => student.answers.length > 0);
        
        if (studentsWithAnswers.length === 0) {
            return 0;
        }

        let classTotal = 0;
        studentsWithAnswers.forEach((student) => {
            classTotal += getStudentGrade(student);
        });

        return classTotal / studentsWithAnswers.length;
    }, [students]);

    return (
        <tfoot className="table-secondary">
            <tr>
                <td className="sticky-column bg-white fw-bold">
                    % réussite
                </td>
                {Array.from({ length: maxQuestions }, (_, index) => (
                    <td
                        key={index}
                        className="text-center fw-bold"
                    >
                        {students.length > 0
                            ? `${getCorrectAnswersPerQuestion(index).toFixed()} %`
                            : '-'}
                    </td>
                ))}
                <td className="text-center fw-bold">
                    {students.length > 0 ? `${classAverage.toFixed()} %` : '-'}
                </td>
            </tr>
        </tfoot>
    );
};

export default LiveResultsTableFooterV2;