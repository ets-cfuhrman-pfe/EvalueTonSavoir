import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { FormattedTextTemplate } from '../../../GiftTemplate/templates/TextTypeTemplate';
import React from "react";
import { StudentType } from "../../../../Types/StudentType";

interface LiveResultsTableBodyProps {
    maxQuestions: number;
    students: StudentType[];
    showUsernames: boolean;
    showCorrectAnswers: boolean;
    getStudentGrade: (student: StudentType) => number;
}

const LiveResultsTableBodyV2: React.FC<LiveResultsTableBodyProps> = ({
    maxQuestions,
    students,
    showUsernames,
    showCorrectAnswers,
    getStudentGrade
}) => {

    return (
        <tbody>
            {students.map((student) => {
                // Visual indication for disconnected students
                const disconnectedClass = student.isConnected === false ? 'student-disconnected' : '';
                
                return (
                <tr key={student.id} className={disconnectedClass}>
                    <td className="sticky-column bg-white fw-medium">
                        {showUsernames ? (
                            <span className={`student-name${student.isConnected === false ? ' student-name-disconnected' : ''}`}>{student.name}</span>
                        ) : '******'}
                    </td>
                    {Array.from({ length: maxQuestions }, (_, index) => {
                        const answer = student.answers.find(
                            (answer) => parseInt(answer.idQuestion.toString()) === index + 1
                        );
                        const answerText = answer ? answer.answer.toString() : '';
                        const isCorrect = answer ? answer.isCorrect : false;

                        let cellClass = '';
                        if (answerText !== '') {
                            cellClass = isCorrect ? 'table-success' : 'table-danger';
                        }

                        return (
                            <td
                                key={index}
                                className={`text-center ${cellClass}`}
                            >
                                {showCorrectAnswers ? (
                                    <div dangerouslySetInnerHTML={{ __html: FormattedTextTemplate({ format: '', text: answerText }) }}></div>
                                ) : (
                                    <>
                                        {isCorrect ? (
                                            <FontAwesomeIcon icon={faCheck} aria-label="correct" className="text-success" />
                                        ) : (
                                            answerText !== '' && (
                                                <FontAwesomeIcon icon={faCircleXmark} aria-label="incorrect" className="text-danger" />
                                            )
                                        )}
                                    </>
                                )}
                            </td>
                        );
                    })}
                    <td className="text-center fw-bold">
                        {getStudentGrade(student).toFixed()} %
                    </td>
                </tr>
                );
            })}
        </tbody>
    );
};

export default LiveResultsTableBodyV2;