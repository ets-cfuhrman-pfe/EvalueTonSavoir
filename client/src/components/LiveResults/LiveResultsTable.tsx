import React, { useMemo } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { StudentType } from 'src/Types/StudentType';
import { QuestionType } from '../../Types/QuestionType';
import { FormattedTextTemplate } from '../GiftTemplate/templates/TextTypeTemplate';

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
    showCorrectAnswers,
    showSelectedQuestion,
    showUsernames
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

    const classAverage: number = useMemo(() => {
        let classTotal = 0;

        students.forEach((student) => {
            classTotal += getStudentGrade(student);
        });

        return classTotal / students.length;
    }, [students]);

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

    return (
        <TableContainer component={Paper}>
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell className="sticky-column">
                        <div className="text-base text-bold">Nom d&apos;utilisateur</div>
                    </TableCell>
                    {Array.from({ length: maxQuestions }, (_, index) => (
                        <TableCell
                            key={index}
                            sx={{
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderStyle: 'solid',
                                borderWidth: 1,
                                borderColor: 'rgba(224, 224, 224, 1)'
                            }}
                            onClick={() => showSelectedQuestion(index)}
                        >
                            <div className="text-base text-bold blue">{`Q${index + 1}`}</div>
                        </TableCell>
                    ))}
                    <TableCell
                        className="sticky-header"
                        sx={{
                            textAlign: 'center',
                            borderStyle: 'solid',
                            borderWidth: 1,
                            borderColor: 'rgba(224, 224, 224, 1)'
                        }}
                    >
                        <div className="text-base text-bold">% réussite</div>
                    </TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {students.map((student) => (
                    <TableRow key={student.id}>
                        <TableCell
                            className="sticky-column"
                            sx={{
                                borderStyle: 'solid',
                                borderWidth: 1,
                                borderColor: 'rgba(224, 224, 224, 1)'
                            }}
                        >
                            <div className="text-base">
                                {showUsernames ? student.name : '******'}
                            </div>
                        </TableCell>
                        {Array.from({ length: maxQuestions }, (_, index) => {
                            const answer = student.answers.find(
                                (answer) => parseInt(answer.idQuestion.toString()) === index + 1
                            );
                            const answerText = answer ? answer.answer.toString() : '';
                            const isCorrect = answer ? answer.isCorrect : false;

                            return (
                                <TableCell
                                    key={index}
                                    sx={{
                                        textAlign: 'center',
                                        borderStyle: 'solid',
                                        borderWidth: 1,
                                        borderColor: 'rgba(224, 224, 224, 1)'
                                    }}
                                    className={
                                        answerText === ''
                                            ? ''
                                            : isCorrect
                                                ? 'correct-answer'
                                                : 'incorrect-answer'
                                    }
                                >
                                    {showCorrectAnswers ? (
                                        <div dangerouslySetInnerHTML={{ __html:FormattedTextTemplate({ format: '', text: answerText }) }}></div>
                                    ) : isCorrect ? (
                                        <FontAwesomeIcon icon={faCheck} />
                                    ) : (
                                        answerText !== '' && (
                                            <FontAwesomeIcon icon={faCircleXmark} />
                                        )
                                    )}
                                </TableCell>
                            );
                        })}
                        <TableCell
                            sx={{
                                textAlign: 'center',
                                borderStyle: 'solid',
                                borderWidth: 1,
                                borderColor: 'rgba(224, 224, 224, 1)',
                                fontWeight: 'bold',
                                color: 'rgba(0, 0, 0)'
                            }}
                        >
                            {getStudentGrade(student).toFixed()} %
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
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
                                color: 'rgba(0, 0, 0)'
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
                            color: 'rgba(0, 0, 0)'
                        }}
                    >
                        {students.length > 0 ? `${classAverage.toFixed()} %` : '-'}
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    </TableContainer>
    );
};

export default LiveResultsTable;