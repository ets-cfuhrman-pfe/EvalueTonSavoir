import React from 'react';
import { Paper, Table, TableContainer } from '@mui/material';
import { StudentType } from 'src/Types/StudentType';
import { QuestionType } from '../../../Types/QuestionType';
import LiveResultsTableFooter from './TableComponents/LiveResultTableFooter';
import LiveResultsTableHeader from './TableComponents/LiveResultsTableHeader';
import LiveResultsTableBody from './TableComponents/LiveResultsTableBody';

interface LiveResultsTableProps {
    students: StudentType[];
    questions: QuestionType[];
    showCorrectAnswers: boolean;
    showSelectedQuestion: (index: number) => void;
    showUsernames: boolean;
}

const LiveResultsTable: React.FC<LiveResultsTableProps> = ({
    questions,
    students,
    showSelectedQuestion,
    showUsernames,
    showCorrectAnswers
}) => {

    const maxQuestions = questions.length;

    const getStudentGrade = (student: StudentType): number => {
        if (student.answers.length === 0) {
            return 0;
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

        return (correctAnswers / questions.length) * 100;
    };


    return (
        <TableContainer component={Paper}>
            <Table size="small">
                <LiveResultsTableHeader
                    maxQuestions={maxQuestions}
                    showSelectedQuestion={showSelectedQuestion}
                />
                <LiveResultsTableBody
                    maxQuestions={maxQuestions}
                    students={students}
                    showUsernames={showUsernames}
                    showCorrectAnswers={showCorrectAnswers}
                    getStudentGrade={getStudentGrade}
                />
                <LiveResultsTableFooter
                    students={students}
                    maxQuestions={maxQuestions}
                    getStudentGrade={getStudentGrade}
                />
            </Table>
        </TableContainer>
    );
};

export default LiveResultsTable;