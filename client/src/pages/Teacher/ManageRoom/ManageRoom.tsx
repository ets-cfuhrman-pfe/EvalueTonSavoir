import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { BaseQuestion, parse, Question } from 'gift-pegjs';
import LiveResultsComponent from 'src/components/LiveResults/LiveResults';
import webSocketService, {
    AnswerReceptionFromBackendType
} from '../../../services/WebsocketService';
import { QuizType } from '../../../Types/QuizType';
import GroupIcon from '@mui/icons-material/Group';
import { ENV_VARIABLES } from 'src/constants';
import { StudentType, Answer } from '../../../Types/StudentType';
import LoadingCircle from 'src/components/LoadingCircle/LoadingCircle';
import { Refresh, Error } from '@mui/icons-material';
import StudentWaitPage from 'src/components/StudentWaitPage/StudentWaitPage';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import ApiService from '../../../services/ApiService';
import { QuestionType } from 'src/Types/QuestionType';
import { Button } from '@mui/material';
import { checkIfIsCorrect } from './useRooms';
import 'bootstrap/dist/css/bootstrap.min.css'; // Add Bootstrap CSS import

const ManageRoom: React.FC = () => {
    const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [students, setStudents] = useState<StudentType[]>([]);
    const { quizId = '', roomName = '' } = useParams<{ quizId: string, roomName: string }>();
    const [quizQuestions, setQuizQuestions] = useState<QuestionType[] | undefined>();
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [quizMode, setQuizMode] = useState<'teacher' | 'student'>('teacher');
    const [connectingError, setConnectingError] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | undefined>(undefined);
    const [quizStarted, setQuizStarted] = useState<boolean>(false);
    const [formattedRoomName, setFormattedRoomName] = useState("");
    const [newlyConnectedUser, setNewlyConnectedUser] = useState<StudentType | null>(null);

    // Handle the newly connected user in useEffect, because it needs state info 
    // not available in the socket.on() callback
    useEffect(() => {
        if (newlyConnectedUser) {
            console.log(`Handling newly connected user: ${newlyConnectedUser.name}`);
            setStudents((prevStudents) => [...prevStudents, newlyConnectedUser]);
    
            // only send nextQuestion if the quiz has started
            if (!quizStarted) {
                console.log(`!quizStarted: returning.... `);
                return;
            }
    
            if (quizMode === 'teacher') {
                webSocketService.nextQuestion({
                    roomName: formattedRoomName,
                    questions: quizQuestions,
                    questionIndex: Number(currentQuestion?.question.id) - 1,
                    isLaunch: true // started late
                });
            } else if (quizMode === 'student') {
                webSocketService.launchStudentModeQuiz(formattedRoomName, quizQuestions);
            } else {
                console.error('Invalid quiz mode:', quizMode);
            }
    
            // Reset the newly connected user state
            setNewlyConnectedUser(null);
        }
    }, [newlyConnectedUser]);

    useEffect(() => {
        const verifyLogin = async () => {
            if (!ApiService.isLoggedIn()) {
                navigate('/teacher/login');
                return;
            }
        };

        verifyLogin();
    }, []);

    useEffect(() => {
        if (!roomName || !quizId) {
            window.alert(
                `Une erreur est survenue.\n La salle ou le quiz n'a pas été spécifié.\nVeuillez réessayer plus tard.`
            );
            console.error(`Room "${roomName}" or Quiz "${quizId}" not found.`);
            navigate('/teacher/dashboard');
        }
        if (roomName && !socket) {
            createWebSocketRoom();
        }
        return () => {
            disconnectWebSocket();
        };
      }, [roomName, navigate]);

    useEffect(() => {
        if (quizId) {
            const fetchQuiz = async () => {
                const quiz = await ApiService.getQuiz(quizId);

                if (!quiz) {
                    window.alert(
                        `Une erreur est survenue.\n Le quiz ${quizId} n'a pas été trouvé\nVeuillez réessayer plus tard`
                    );
                    console.error('Quiz not found for id:', quizId);
                    navigate('/teacher/dashboard');
                    return;
                }

                setQuiz(quiz as QuizType);
            };

            fetchQuiz();
        } else {
            window.alert(
                `Une erreur est survenue.\n Le quiz ${quizId} n'a pas été trouvé\nVeuillez réessayer plus tard`
            );
            console.error('Quiz not found for id:', quizId);
            navigate('/teacher/dashboard');
            return;
        }
    }, [quizId]);

    const disconnectWebSocket = () => {
        if (socket) {
            webSocketService.endQuiz(formattedRoomName);
            webSocketService.disconnect();
            setSocket(null);
            setQuizQuestions(undefined);
            setCurrentQuestion(undefined);
            setStudents(new Array<StudentType>());
        }
    };

    const createWebSocketRoom = () => {
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        const roomNameUpper = roomName.toUpperCase();
        setFormattedRoomName(roomNameUpper);
        console.log(`Creating WebSocket room named ${roomNameUpper}`);

        /** 
         * ATTENTION: Lire les variables d'état dans 
         * les .on() n'est pas une bonne pratique.
         * Les valeurs sont celles au moment de la création
         * de la fonction et non au moment de l'exécution.
         * Il faut utiliser des refs pour les valeurs qui
         * changent fréquemment. Sinon, utiliser un trigger
         * de useEffect pour mettre déclencher un traitement
         * (voir user-joined plus bas).
         */
        socket.on('connect', () => {
            webSocketService.createRoom(roomNameUpper);
        });

        socket.on('connect_error', (error) => {
            setConnectingError('Erreur lors de la connexion... Veuillez réessayer');
            console.error('ManageRoom: WebSocket connection error:', error);
        });

        socket.on('create-success', (createdRoomName: string) => {
            console.log(`Room created: ${createdRoomName}`);
        });

        socket.on('user-joined', (student: StudentType) => {
            setNewlyConnectedUser(student);
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

        if (socket) {
            console.log(`Listening for submit-answer-room in room ${formattedRoomName}`);
            socket.on('submit-answer-room', (answerData: AnswerReceptionFromBackendType) => {
                const { answer, idQuestion, idUser, username } = answerData;
                console.log(
                    `Received answer from ${username} for question ${idQuestion}: ${answer}`
                );
                if (!quizQuestions) {
                    console.log('Quiz questions not found (cannot update answers without them).');
                    return;
                }

                // Update the students state using the functional form of setStudents
                setStudents((prevStudents) => {
                    console.log('Current students:');
                    prevStudents.forEach((student) => {
                        console.log(student.name);
                    });

                    let foundStudent = false;
                    const updatedStudents = prevStudents.map((student) => {
                        console.log(`Comparing ${student.id} to ${idUser}`);
                        if (student.id === idUser) {
                            foundStudent = true;
                            const existingAnswer = student.answers.find(
                                (ans) => ans.idQuestion === idQuestion
                            );
                            let updatedAnswers: Answer[] = [];
                            if (existingAnswer) {
                                updatedAnswers = student.answers.map((ans) => {
                                    console.log(`Comparing ${ans.idQuestion} to ${idQuestion}`);
                                    return ans.idQuestion === idQuestion
                                        ? {
                                              ...ans,
                                              answer,
                                              isCorrect: checkIfIsCorrect(
                                                  answer,
                                                  idQuestion,
                                                  quizQuestions!
                                              )
                                          }
                                        : ans;
                                });
                            } else {
                                const newAnswer = {
                                    idQuestion,
                                    answer,
                                    isCorrect: checkIfIsCorrect(answer, idQuestion, quizQuestions!)
                                };
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

    const nextQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const nextQuestionIndex = Number(currentQuestion?.question.id);

        if (nextQuestionIndex === undefined || nextQuestionIndex > quizQuestions.length - 1) return;

        setCurrentQuestion(quizQuestions[nextQuestionIndex]);
        webSocketService.nextQuestion({roomName: formattedRoomName, 
                                       questions: quizQuestions, 
                                       questionIndex: nextQuestionIndex, 
                                       isLaunch: false});
    };

    const previousQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const prevQuestionIndex = Number(currentQuestion?.question.id) - 2; // -2 because question.id starts at index 1

        if (prevQuestionIndex === undefined || prevQuestionIndex < 0) return;
        setCurrentQuestion(quizQuestions[prevQuestionIndex]);
        webSocketService.nextQuestion({roomName: formattedRoomName, questions: quizQuestions, questionIndex: prevQuestionIndex, isLaunch: false});
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
        webSocketService.nextQuestion({roomName: formattedRoomName, questions: quizQuestions, questionIndex: 0, isLaunch: true});
    };

    const launchStudentMode = () => {
        const quizQuestions = initializeQuizQuestion();
        console.log('launchStudentMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchStudentMode). No questions found.');
            return;
        }
        setQuizQuestions(quizQuestions);
        webSocketService.launchStudentModeQuiz(formattedRoomName, quizQuestions);
    };

    const launchQuiz = () => {
        setQuizStarted(true);
        if (!socket || !formattedRoomName || !quiz?.content || quiz?.content.length === 0) {
            // TODO: This error happens when token expires! Need to handle it properly
            console.log(
                `Error launching quiz. socket: ${socket}, roomName: ${formattedRoomName}, quiz: ${quiz}`
            );
            return;
        }
        console.log(`Launching quiz in ${quizMode} mode...`);
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
                webSocketService.nextQuestion({roomName: formattedRoomName, questions: quizQuestions, questionIndex, isLaunch: false});
            }
        }
    };

    const handleReturn = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard');
    };

    if (!formattedRoomName) {
        return (
            <div className="d-flex flex-column justify-content-center align-items-center vh-100">
                {!connectingError ? (
                    <LoadingCircle text="Veuillez attendre la connexion au serveur..." />
                ) : (
                    <div className="d-flex flex-column align-items-center gap-3">
                        <Error sx={{ padding: 0 }} />
                        <div className="text-center">{connectingError}</div>
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
        <div className="container-fluid p-3">
            <h1 className="text-center mb-4">Salle : {formattedRoomName}</h1>

            {/* Room Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <DisconnectButton
                    onReturn={handleReturn}
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter?`}
                />

                <div className="d-flex align-items-center ms-auto">
                    <GroupIcon className="me-2" />
                    <span className="text-muted">{students.length}/60</span>
                </div>
            </div>

            {/* Main Content */}
            {quizQuestions ? (
                <div className="d-flex flex-column">
                    <h2 className="text-center mb-3">{quiz?.title}</h2>
                    {!isNaN(Number(currentQuestion?.question.id)) && (
                        <p className="text-center fw-bold mb-3">
                            Question {Number(currentQuestion?.question.id)}/{quizQuestions?.length}
                        </p>
                    )}

                    <div className="mb-4" style={{ height: '70vh', overflow: 'auto' }}>
                        <div className="d-flex flex-column gap-4">
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
                            />
                        </div>
                    </div>

                    {quizMode === 'teacher' && (
                        <div className="d-flex justify-content-center gap-3 mb-4">
                            <Button
                                onClick={previousQuestion}
                                variant="contained"
                                disabled={Number(currentQuestion?.question.id) <= 1}
                                className="px-4"
                            >
                                Question précédente
                            </Button>
                            <Button
                                onClick={nextQuestion}
                                variant="contained"
                                disabled={
                                    Number(currentQuestion?.question.id) >= quizQuestions.length
                                }
                                className="px-4"
                            >
                                Prochaine question
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <StudentWaitPage
                    students={students}
                    launchQuiz={launchQuiz}
                    setQuizMode={setQuizMode}
                />
            )}
        </div>
    );
};

export default ManageRoom;