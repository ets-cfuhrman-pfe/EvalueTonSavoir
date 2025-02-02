// ManageRoom.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { ParsedGIFTQuestion, BaseQuestion, parse, Question } from 'gift-pegjs';
import { isSimpleNumericalAnswer, isRangeNumericalAnswer, isHighLowNumericalAnswer } from "gift-pegjs/typeGuards";
import LiveResultsComponent from 'src/components/LiveResults/LiveResults';
// import { QuestionService } from '../../../services/QuestionService';
import webSocketService, { AnswerReceptionFromBackendType } from '../../../services/WebsocketService';
import { QuizType } from '../../../Types/QuizType';

import './manageRoom.css';
import { ENV_VARIABLES } from 'src/constants';
import { StudentType, Answer } from '../../../Types/StudentType';
import { Button } from '@mui/material';
import LoadingCircle from 'src/components/LoadingCircle/LoadingCircle';
import { Refresh, Error } from '@mui/icons-material';
import StudentWaitPage from 'src/components/StudentWaitPage/StudentWaitPage';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
//import QuestionNavigation from 'src/components/QuestionNavigation/QuestionNavigation';
import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import ApiService from '../../../services/ApiService';
import { QuestionType } from 'src/Types/QuestionType';

const ManageRoom: React.FC = () => {
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState<string>('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [students, setStudents] = useState<StudentType[]>([]);
    const quizId = useParams<{ id: string }>();
    const [quizQuestions, setQuizQuestions] = useState<QuestionType[] | undefined>();
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [quizMode, setQuizMode] = useState<'teacher' | 'student'>('teacher');
    const [connectingError, setConnectingError] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | undefined>(undefined);

    useEffect(() => {
        if (quizId.id) {
            const fetchquiz = async () => {

                const quiz = await ApiService.getQuiz(quizId.id as string);

                if (!quiz) {
                    window.alert(`Une erreur est survenue.\n Le quiz ${quizId.id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
                    console.error('Quiz not found for id:', quizId.id);
                    navigate('/teacher/dashboard');
                    return;
                }

                setQuiz(quiz as QuizType);

                if (!socket) {
                    console.log(`no socket in ManageRoom, creating one.`);
                    createWebSocketRoom();
                }

                // return () => {
                //     webSocketService.disconnect();
                // };
            };

            fetchquiz();

        } else {
            window.alert(`Une erreur est survenue.\n Le quiz ${quizId.id} n'a pas été trouvé\nVeuillez réessayer plus tard`)
            console.error('Quiz not found for id:', quizId.id);
            navigate('/teacher/dashboard');
            return;
        }
    }, [quizId]);

    const disconnectWebSocket = () => {
        if (socket) {
            webSocketService.endQuiz(roomName);
            webSocketService.disconnect();
            setSocket(null);
            setQuizQuestions(undefined);
            setCurrentQuestion(undefined);
            setStudents(new Array<StudentType>());
            setRoomName('');
        }
    };

    const createWebSocketRoom = () => {
        console.log('Creating WebSocket room...');
        setConnectingError('');
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);

        socket.on('connect', () => {
            webSocketService.createRoom();
        });
        socket.on('connect_error', (error) => {
            setConnectingError('Erreur lors de la connexion... Veuillez réessayer');
            console.error('ManageRoom: WebSocket connection error:', error);
        });
        socket.on('create-success', (roomName: string) => {
            setRoomName(roomName);
        });
        socket.on('create-failure', () => {
            console.log('Error creating room.');
        });
        socket.on('user-joined', (student: StudentType) => {
            console.log(`Student joined: name = ${student.name}, id = ${student.id}`);

            setStudents((prevStudents) => [...prevStudents, student]);

            if (quizMode === 'teacher') {
                webSocketService.nextQuestion(roomName, currentQuestion);
            } else if (quizMode === 'student') {
                webSocketService.launchStudentModeQuiz(roomName, quizQuestions);
            }
        });
        socket.on('join-failure', (message) => {
            setConnectingError(message);
            setSocket(null);
        });
        socket.on('user-disconnected', (userId: string) => {
            console.log(`Student left: id = ${userId}`);
            setStudents((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        });
        setSocket(socket);
    };

    useEffect(() => {
        // This is here to make sure the correct value is sent when user join
        if (socket) {
            console.log(`Listening for user-joined in room ${roomName}`);
            socket.on('user-joined', (_student: StudentType) => {
                if (quizMode === 'teacher') {
                    webSocketService.nextQuestion(roomName, currentQuestion);
                } else if (quizMode === 'student') {
                    webSocketService.launchStudentModeQuiz(roomName, quizQuestions);
                }
            });
        }

        if (socket) {
            // handle the case where user submits an answer
            console.log(`Listening for submit-answer-room in room ${roomName}`);
            socket.on('submit-answer-room', (answerData: AnswerReceptionFromBackendType) => {
                const { answer, idQuestion, idUser, username } = answerData;
                console.log(`Received answer from ${username} for question ${idQuestion}: ${answer}`);
                if (!quizQuestions) {
                    console.log('Quiz questions not found (cannot update answers without them).');
                    return;
                }
    
                // Update the students state using the functional form of setStudents
                setStudents((prevStudents) => {
                    // print the list of current student names
                    console.log('Current students:');
                    prevStudents.forEach((student) => {
                        console.log(student.name);
                    });
    
                    let foundStudent = false;
                    const updatedStudents = prevStudents.map((student) => {
                        console.log(`Comparing ${student.id} to ${idUser}`);
                        if (student.id === idUser) {
                            foundStudent = true;
                            const existingAnswer = student.answers.find((ans) => ans.idQuestion === idQuestion);
                            let updatedAnswers: Answer[] = [];
                            if (existingAnswer) {
                                // Update the existing answer
                                updatedAnswers = student.answers.map((ans) => {
                                    console.log(`Comparing ${ans.idQuestion} to ${idQuestion}`);
                                    return (ans.idQuestion === idQuestion ? { ...ans, answer, isCorrect: checkIfIsCorrect(answer, idQuestion, quizQuestions!) } : ans);
                                });
                            } else {
                                // Add a new answer
                                const newAnswer = { idQuestion, answer, isCorrect: checkIfIsCorrect(answer, idQuestion, quizQuestions!) };
                                updatedAnswers = [...student.answers, newAnswer];
                            }
                            return { ...student, answers: updatedAnswers };
                                    }
                        return student;
                    });
                    if (!foundStudent) {
                        console.log(`Student ${username} not found in the list.`);
                    }
                    return updatedStudents;
                });
            });
            setSocket(socket);
        }

    }, [socket, currentQuestion, quizQuestions]);

    // useEffect(() => {
    //     if (socket) {
    //         const submitAnswerHandler = (answerData: answerSubmissionType) => {
    //             const { answer, idQuestion, username } = answerData;
    //             console.log(`Received answer from ${username} for question ${idQuestion}: ${answer}`);

    //             // print the list of current student names
    //             console.log('Current students:');
    //             students.forEach((student) => {
    //                 console.log(student.name);
    //             });

    //             // Update the students state using the functional form of setStudents
    //             setStudents((prevStudents) => {
    //                 let foundStudent = false;
    //                 const updatedStudents = prevStudents.map((student) => {
    //                     if (student.id === username) {
    //                         foundStudent = true;
    //                         const updatedAnswers = student.answers.map((ans) => {
    //                             const newAnswer: Answer = { answer, isCorrect: checkIfIsCorrect(answer, idQuestion, quizQuestions!), idQuestion };
    //                             console.log(`Updating answer for ${student.name} for question ${idQuestion} to ${answer}`);
    //                             return (ans.idQuestion === idQuestion ? { ...ans, newAnswer } : ans);
    //                         }
    //                         );
    //                         return { ...student, answers: updatedAnswers };
    //                     }
    //                     return student;
    //                 });
    //                 if (!foundStudent) {
    //                     console.log(`Student ${username} not found in the list of students in LiveResults`);
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


    const nextQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const nextQuestionIndex = Number(currentQuestion?.question.id);

        if (nextQuestionIndex === undefined || nextQuestionIndex > quizQuestions.length - 1) return;

        setCurrentQuestion(quizQuestions[nextQuestionIndex]);
        webSocketService.nextQuestion(roomName, quizQuestions[nextQuestionIndex]);
    };

    const previousQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const prevQuestionIndex = Number(currentQuestion?.question.id) - 2; // -2 because question.id starts at index 1

        if (prevQuestionIndex === undefined || prevQuestionIndex < 0) return;
        setCurrentQuestion(quizQuestions[prevQuestionIndex]);
        webSocketService.nextQuestion(roomName, quizQuestions[prevQuestionIndex]);
    };

    const initializeQuizQuestion = () => {
        const quizQuestionArray = quiz?.content;
        if (!quizQuestionArray) return null;
        const parsedQuestions = [] as QuestionType[];

        quizQuestionArray.forEach((question, index) => {
            parsedQuestions.push({ question: parse(question)[0] as BaseQuestion });
            parsedQuestions[index].question.id = (index + 1).toString();
        });
        if (parsedQuestions.length === 0) return null;

        setQuizQuestions(parsedQuestions);
        return parsedQuestions;
    };

    const launchTeacherMode = () => {
        const quizQuestions = initializeQuizQuestion();
        console.log('launchTeacherMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchTeacherMode). No questions found.');
            return;
        }

        setCurrentQuestion(quizQuestions[0]);
        webSocketService.nextQuestion(roomName, quizQuestions[0]);
    };

    const launchStudentMode = () => {
        const quizQuestions = initializeQuizQuestion();
        console.log('launchStudentMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchStudentMode). No questions found.');
            return;
        }
        setQuizQuestions(quizQuestions);
        webSocketService.launchStudentModeQuiz(roomName, quizQuestions);
    };

    const launchQuiz = () => {
        if (!socket || !roomName || !quiz?.content || quiz?.content.length === 0) {
            // TODO: This error happens when token expires! Need to handle it properly
            console.log(`Error launching quiz. socket: ${socket}, roomName: ${roomName}, quiz: ${quiz}`);
            return;
        }
        switch (quizMode) {
            case 'student':
                return launchStudentMode();
            case 'teacher':
                return launchTeacherMode();
        }
    };

    const showSelectedQuestion = (questionIndex: number) => {
        if (quiz?.content && quizQuestions) {
            setCurrentQuestion(quizQuestions[questionIndex]);

            if (quizMode === 'teacher') {
                webSocketService.nextQuestion(roomName, quizQuestions[questionIndex]);
            }
        }
    };

    const handleReturn = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard');
    };

    function checkIfIsCorrect(answer: string | number | boolean, idQuestion: number, questions: QuestionType[]): boolean {
        const questionInfo = questions.find((q) =>
            q.question.id ? q.question.id === idQuestion.toString() : false
        ) as QuestionType | undefined;

        const answerText = answer.toString();
        if (questionInfo) {
            const question = questionInfo.question as ParsedGIFTQuestion;
            if (question.type === 'TF') {
                return (
                    (question.isTrue && answerText == 'true') ||
                    (!question.isTrue && answerText == 'false')
                );
            } else if (question.type === 'MC') {
                return question.choices.some(
                    (choice) => choice.isCorrect && choice.formattedText.text === answerText
                );
            } else if (question.type === 'Numerical') {
                if (isHighLowNumericalAnswer(question.choices[0])) {
                    const choice = question.choices[0];
                    const answerNumber = parseFloat(answerText);
                    if (!isNaN(answerNumber)) {
                        return (
                            answerNumber <= choice.numberHigh &&
                            answerNumber >= choice.numberLow
                        );
                    }
                }
                if (isRangeNumericalAnswer(question.choices[0])) {
                    const answerNumber = parseFloat(answerText);
                    const range = question.choices[0].range;
                    const correctAnswer = question.choices[0].number;
                    if (!isNaN(answerNumber)) {
                        return (
                            answerNumber <= correctAnswer + range &&
                            answerNumber >= correctAnswer - range
                        );
                    }
                }
                if (isSimpleNumericalAnswer(question.choices[0])) {
                    const answerNumber = parseFloat(answerText);
                    if (!isNaN(answerNumber)) {
                        return answerNumber === question.choices[0].number;
                    }
                }
            } else if (question.type === 'Short') {
                return question.choices.some(
                    (choice) => choice.text.toUpperCase() === answerText.toUpperCase()
                );
            }
        }
        return false;
    }


    if (!roomName) {
        return (
            <div className="center">
                {!connectingError ? (
                    <LoadingCircle text="Veuillez attendre la connexion au serveur..." />
                ) : (
                    <div className="center-v-align">
                        <Error sx={{ padding: 0 }} />
                        <div className="text-base">{connectingError}</div>
                        <Button
                            variant="contained"
                            startIcon={<Refresh />}
                            onClick={createWebSocketRoom}
                        >
                            Reconnecter
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className='room'>
            <div className='roomHeader'>

                <DisconnectButton
                    onReturn={handleReturn}
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter?`} />

                <div className='centerTitle'>
                    <div className='title'>Salle: {roomName}</div>
                    <div className='userCount subtitle'>Utilisateurs: {students.length}/60</div>
                </div>

                <div className='dumb'></div>

            </div>
            {/* the following breaks the css (if 'room' classes are nested) */}
            <div className=''>

                {quizQuestions ? (

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <div className="title center-h-align mb-2">{quiz?.title}</div>

                        {quizMode === 'teacher' && (

                            <div className="mb-1">
                                {/* <QuestionNavigation
                                    currentQuestionId={Number(currentQuestion?.question.id)}
                                    questionsLength={quizQuestions?.length}
                                    previousQuestion={previousQuestion}
                                    nextQuestion={nextQuestion}
                                /> */}
                            </div>

                        )}

                        <div className="mb-2 flex-column-wrapper">
                            <div className="preview-and-result-container">

                                {currentQuestion && (
                                    <QuestionDisplay
                                        showAnswer={false}
                                        question={currentQuestion?.question as Question}
                                    />
                                )}

                                <LiveResultsComponent
                                    quizMode={quizMode}
                                    socket={socket}
                                    questions={quizQuestions}
                                    showSelectedQuestion={showSelectedQuestion}
                                    students={students}
                                ></LiveResultsComponent>

                            </div>
                        </div>

                        {quizMode === 'teacher' && (
                        <div className="questionNavigationButtons" style={{ display: 'flex', justifyContent: 'center' }}>
                            <div className="previousQuestionButton">
                                <Button onClick={previousQuestion} 
                                variant="contained" 
                                disabled={Number(currentQuestion?.question.id) <= 1}>
                                    Question précédente
                                </Button>
                            </div>
                            <div className="nextQuestionButton">
                                <Button onClick={nextQuestion} 
                                variant="contained" 
                                disabled={Number(currentQuestion?.question.id) >=quizQuestions.length}
                                >
                                    Prochaine question
                                </Button>
                            </div>
                        </div> )}

                    </div>

                ) : (

                    <StudentWaitPage
                        students={students}
                        launchQuiz={launchQuiz}
                        setQuizMode={setQuizMode}
                    />

                )}
            </div>

        </div>
    );
};

export default ManageRoom;
