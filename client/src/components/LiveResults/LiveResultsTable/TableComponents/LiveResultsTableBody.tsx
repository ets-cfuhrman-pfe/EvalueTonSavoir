import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TableBody, TableCell, TableRow } from "@mui/material";
import { faCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FormattedTextTemplate } from '../../../GiftTemplate/templates/TextTypeTemplate';
import React from "react";
import { Student } from "src/Types/StudentType";

interface LiveResultsFooterProps {
    maxQuestions: number;
    students: Student[];
    showUsernames: boolean;
    showCorrectAnswers: boolean;
    getStudentGrade: (student: Student) => number;

}

const LiveResultsTableFooter: React.FC<LiveResultsFooterProps> = ({
    maxQuestions,
    students,
    showUsernames,
    showCorrectAnswers,
    getStudentGrade
}) => {

    return (
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
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: '', text: answerText }) }}></div>
                                ) : isCorrect ? (
                                    <FontAwesomeIcon icon={faCheck} aria-label="correct" />
                                ) : (
                                    answerText !== '' && (
                                        <FontAwesomeIcon icon={faCircleXmark} aria-label="incorrect"/>
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
    );
};
export default LiveResultsTableFooter;