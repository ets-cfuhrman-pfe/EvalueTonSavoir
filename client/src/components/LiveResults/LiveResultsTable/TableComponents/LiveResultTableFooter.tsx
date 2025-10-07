import { TableCell, TableFooter, TableRow } from "@mui/material";
import React, { useMemo } from "react";
import { StudentType } from "src/Types/StudentType";

interface LiveResultsFooterProps {
    students: StudentType[];
    maxQuestions: number;
    getStudentGrade: (student: StudentType) => number;
}

const LiveResultsTableFooter: React.FC<LiveResultsFooterProps> = ({
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
        <TableFooter>
            <TableRow sx={{ backgroundColor: '#d3d3d34f' }}>
                <TableCell className="sticky-column" sx={{ color: 'black' }}>
                    <div className="text-base text-bold">% réussite</div>
                </TableCell>
                {Array.from({ length: maxQuestions }, (_, index) => (
                    <TableCell
                        key={index}
                        sx={{
                            textAlign: 'center',
                            borderStyle: 'solid',
                            borderWidth: 1,
                            borderColor: 'rgba(224, 224, 224, 1)',
                            fontWeight: 'bold',
                            color: 'rgba(0, 0, 0)',
                        }}
                    >
                        {students.length > 0
                            ? `${getCorrectAnswersPerQuestion(index).toFixed()} %`
                            : '-'}
                    </TableCell>
                ))}
                <TableCell
                    sx={{
                        textAlign: 'center',
                        borderStyle: 'solid',
                        borderWidth: 1,
                        borderColor: 'rgba(224, 224, 224, 1)',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        color: 'rgba(0, 0, 0)',
                    }}
                >
                    {students.length > 0 ? `${classAverage.toFixed()} %` : '-'}
                </TableCell>
            </TableRow>
        </TableFooter>
    );
};
export default LiveResultsTableFooter;
