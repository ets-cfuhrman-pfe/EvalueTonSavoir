import React from 'react';
import { Paper, Table, TableContainer } from '@mui/material';
import { StudentType } from '../../../Types/StudentType';
import { QuestionType } from '../../../Types/QuestionType';
import LiveResultsTableHeaderV2 from './TableComponents/LiveResultsTableHeaderV2';
import LiveResultsTableBodyV2 from './TableComponents/LiveResultsTableBodyV2';
import LiveResultsTableFooterV2 from './TableComponents/LiveResultsTableFooterV2';

interface LiveResultsTableProps {
    students: StudentType[];
    questions: QuestionType[];
    showCorrectAnswers: boolean;
    showSelectedQuestion: (index: number) => void;
    showUsernames: boolean;
    selectedQuestionIndex?: number;
}

const LiveResultsTableV2: React.FC<LiveResultsTableProps> = ({
    questions,
    students,
    showSelectedQuestion,
    showUsernames,
    showCorrectAnswers,
    selectedQuestionIndex
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
        <TableContainer component={Paper} className="table-responsive">
            <Table size="small" className="table table-sm table-bordered mb-0">
                <LiveResultsTableHeaderV2
                    maxQuestions={maxQuestions}
                    showSelectedQuestion={showSelectedQuestion}
                    selectedQuestionIndex={selectedQuestionIndex}
                />
                <LiveResultsTableBodyV2
                    maxQuestions={maxQuestions}
                    students={students}
                    showUsernames={showUsernames}
                    showCorrectAnswers={showCorrectAnswers}
                    getStudentGrade={getStudentGrade}
                />
                <LiveResultsTableFooterV2
                    students={students}
                    maxQuestions={maxQuestions}
                    getStudentGrade={getStudentGrade}
                />
            </Table>
        </TableContainer>
    );
};

export default LiveResultsTableV2;