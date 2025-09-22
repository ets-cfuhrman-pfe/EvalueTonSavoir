import React, { useMemo } from "react";
import { StudentType } from "../../../../Types/StudentType";

interface LiveResultsTableFooterProps {
    students: StudentType[];
    maxQuestions: number;
    getStudentGrade: (student: StudentType) => number;
}

const LiveResultsTableFooterV2: React.FC<LiveResultsTableFooterProps> = ({
    maxQuestions,
    students,
    getStudentGrade
}) => {

    const getCorrectAnswersPerQuestion = (index: number): number => {
        return (
            (students.filter((student) =>
                student.answers.some(
                    (answer) =>
                        parseInt(answer.idQuestion.toString()) === index + 1 && answer.isCorrect
                )
            ).length / students.length) * 100
        );
    };

    const classAverage: number = useMemo(() => {
        let classTotal = 0;

        students.forEach((student) => {
            classTotal += getStudentGrade(student);
        });

        return classTotal / students.length;
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