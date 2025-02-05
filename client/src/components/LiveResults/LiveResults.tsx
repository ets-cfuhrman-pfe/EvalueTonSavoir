// LiveResults.tsx
import React, { useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { QuestionType } from '../../Types/QuestionType';

import './liveResult.css';
import {
    Button,
    FormControlLabel,
    FormGroup,
    Paper,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableFooter,
    TableHead,
    TableRow
} from '@mui/material';
import { StudentType } from '../../Types/StudentType';
import { formatLatex } from '../GiftTemplate/templates/TextTypeTemplate';

interface LiveResultsProps {
    socket: Socket | null;
    questions: QuestionType[];
    showSelectedQuestion: (index: number) => void;
    quizMode: 'teacher' | 'student';
    students: StudentType[]
}

// interface Answer {
//     answer: string | number | boolean;
//     isCorrect: boolean;
//     idQuestion: number;
// }

// interface StudentResult {
//     username: string;
//     idUser: string;
//     answers: Answer[];
// }

const LiveResults: React.FC<LiveResultsProps> = ({ questions, showSelectedQuestion, students }) => {
    const [showUsernames, setShowUsernames] = useState<boolean>(false);
    const [showCorrectAnswers, setShowCorrectAnswers] = useState<boolean>(false);
    const [showFullAnswer, setShowFullAnswer] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState('');

    const handleShowAnswer = (answer: string) => {
        setSelectedAnswer(answer);
        setShowFullAnswer(true);
    };

    const renderAnswerCell = (answer: string) => {
        if (!answer) return null;
        const shortAnswer = answer.length > 20 ? answer.slice(0, 20) : answer;

        return (
            <>
                <span>{shortAnswer}</span>
                {answer.length > 20 && (
                    <button onClick={() => handleShowAnswer(answer)}
                    style={{
                        backgroundColor: '#D3D3D3', // Darker background color
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.1rem 0.4rem',
                        cursor: 'pointer',
                        marginLeft: '0.5rem'
                    }}>...</button>
                )}
            </>
        );
    };
    // const [students, setStudents] = useState<StudentType[]>(initialStudents);
    // const [studentResultsMap, setStudentResultsMap] = useState<Map<string, StudentResult>>(new Map());

    const maxQuestions = questions.length;

    // useEffect(() => {
    //     // Initialize the map with the current students
    //     const newStudentResultsMap = new Map<string, StudentResult>();

    //     for (const student of students) {
    //         newStudentResultsMap.set(student.id, { username: student.name, idUser: student.id, answers: [] });
    //     }

    //     setStudentResultsMap(newStudentResultsMap);
    // }, [])

    // update when students change
    // useEffect(() => {
    //     // studentResultsMap is inconsistent with students -- need to update

    //     for (const student of students as StudentType[]) {
    //     }

    // }, [students])

    // useEffect(() => {
    //     if (socket) {
    //         const submitAnswerHandler = ({
    //             idUser,
    //             answer,
    //             idQuestion
    //         }: {
    //             idUser: string;
    //             username: string;
    //             answer: string | number | boolean;
    //             idQuestion: number;
    //         }) => {
    //             console.log(`Received answer from ${idUser} for question ${idQuestion}: ${answer}`);

    //             // print the list of current student names
    //             console.log('Current students:');
    //             students.forEach((student) => {
    //                 console.log(student.name);
    //             });

    //             // Update the students state using the functional form of setStudents
    //             setStudents((prevStudents) => {
    //                 let foundStudent = false;
    //                 const updatedStudents = prevStudents.map((student) => {
    //                     if (student.id === idUser) {
    //                         foundStudent = true;
    //                         const updatedAnswers = student.answers.map((ans) => {
    //                             const newAnswer: Answer = { answer, isCorrect: checkIfIsCorrect(answer, idQuestion), idQuestion };
    //                             console.log(`Updating answer for ${student.name} for question ${idQuestion} to ${answer}`);
    //                             return (ans.idQuestion === idQuestion ? { ...ans, newAnswer } : ans);
    //                         }
    //                         );
    //                         return { ...student, answers: updatedAnswers };
    //                     }
    //                     return student;
    //                 });
    //                 if (!foundStudent) {
    //                     console.log(`Student ${idUser} not found in the list of students in LiveResults`);
    //                 }
    //                 return updatedStudents;
    //             });


    //             // make a copy of the students array so we can update it
    //             // const updatedStudents = [...students];

    //             // const student = updatedStudents.find((student) => student.id === idUser);
    //             // if (!student) {
    //             //     // this is a bad thing if an answer was submitted but the student isn't in the list
    //             //     console.log(`Student ${idUser} not found in the list of students in LiveResults`);
    //             //     return;
    //             // }

    //             // const isCorrect = checkIfIsCorrect(answer, idQuestion);
    //             // const newAnswer: Answer = { answer, isCorrect, idQuestion };
    //             // student.answers.push(newAnswer);
    //             // // print list of answers
    //             // console.log('Answers:');
    //             // student.answers.forEach((answer) => {
    //             //     console.log(answer.answer);
    //             // });
    //             // setStudents(updatedStudents); // update the state
    //         };

    //         socket.on('submit-answer', submitAnswerHandler);
    //         return () => {
    //             socket.off('submit-answer');
    //         };
    //     }
    // }, [socket]);

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

    //     (studentResults.filter((student) =>
    //         student.answers.some(
    //             (answer) =>
    //                 parseInt(answer.idQuestion.toString()) === index + 1 && answer.isCorrect
    //         )
    //     ).length /
    //         studentResults.length) *
    //     100
    // );
    // };

    // function checkIfIsCorrect(answer: string | number | boolean, idQuestion: number): boolean {
    //     const questionInfo = questions.find((q) =>
    //         q.question.id ? q.question.id === idQuestion.toString() : false
    //     ) as QuestionType | undefined;

    //     const answerText = answer.toString();
    //     if (questionInfo) {
    //         const question = questionInfo.question as GIFTQuestion;
    //         if (question.type === 'TF') {
    //             return (
    //                 (question.isTrue && answerText == 'true') ||
    //                 (!question.isTrue && answerText == 'false')
    //             );
    //         } else if (question.type === 'MC') {
    //             return question.choices.some(
    //                 (choice) => choice.isCorrect && choice.text.text === answerText
    //             );
    //         } else if (question.type === 'Numerical') {
    //             if (question.choices && !Array.isArray(question.choices)) {
    //                 if (
    //                     question.choices.type === 'high-low' &&
    //                     question.choices.numberHigh &&
    //                     question.choices.numberLow
    //                 ) {
    //                     const answerNumber = parseFloat(answerText);
    //                     if (!isNaN(answerNumber)) {
    //                         return (
    //                             answerNumber <= question.choices.numberHigh &&
    //                             answerNumber >= question.choices.numberLow
    //                         );
    //                     }
    //                 }
    //             }
    //             if (question.choices && Array.isArray(question.choices)) {
    //                 if (
    //                     question.choices[0].text.type === 'range' &&
    //                     question.choices[0].text.number &&
    //                     question.choices[0].text.range
    //                 ) {
    //                     const answerNumber = parseFloat(answerText);
    //                     const range = question.choices[0].text.range;
    //                     const correctAnswer = question.choices[0].text.number;
    //                     if (!isNaN(answerNumber)) {
    //                         return (
    //                             answerNumber <= correctAnswer + range &&
    //                             answerNumber >= correctAnswer - range
    //                         );
    //                     }
    //                 }
    //                 if (
    //                     question.choices[0].text.type === 'simple' &&
    //                     question.choices[0].text.number
    //                 ) {
    //                     const answerNumber = parseFloat(answerText);
    //                     if (!isNaN(answerNumber)) {
    //                         return answerNumber === question.choices[0].text.number;
    //                     }
    //                 }
    //             }
    //         } else if (question.type === 'Short') {
    //             return question.choices.some(
    //                 (choice) => choice.text.text.toUpperCase() === answerText.toUpperCase()
    //             );
    //         }
    //     }
    //     return false;
    // }

    return (

        
        <div>
            <div className="action-bar mb-1">
                <div className="text-2xl text-bold">Résultats du quiz</div>
                <FormGroup row>
                    <FormControlLabel
                        label={<div className="text-sm">Afficher les noms</div>}
                        control={
                            <Switch
                                value={showUsernames}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setShowUsernames(e.target.checked)
                                }
                            />
                        }
                    />
                    <FormControlLabel
                        label={<div className="text-sm">Afficher les réponses</div>}
                        control={
                            <Switch
                                value={showCorrectAnswers}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setShowCorrectAnswers(e.target.checked)
                                }
                            />
                        }
                    />
                </FormGroup>
            </div>

            <div className="table-container">
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
                                            style={{ maxWidth: '65px'}}
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
                                                    <div>{renderAnswerCell(formatLatex(answerText))}</div>
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
            </div>                  
            {showFullAnswer && (
    <div
    onClick={() => setShowFullAnswer(false)}
    style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.3)',
        zIndex: 9999,}}>
    <dialog
         open
         onClick={(e) => e.stopPropagation()} 
        style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            border: 'none',
            padding: '1rem',
            background: '#fff',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            minWidth: '300px',
            minHeight: '200px',
        }}
    >
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                maxWidth: '600px',
                wordWrap: 'break-word',
            }}
        >            
       <p style={{ margin: 0 }}>{selectedAnswer}</p>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setShowFullAnswer(false)}
                sx={{
                    position: 'absolute',
                    bottom: '1rem',
                    right: '1rem',
                }}
            >
                Fermer
            </Button>
        </div>
    </dialog>
    </div>
)}
        </div>
    );
};

export default LiveResults;
