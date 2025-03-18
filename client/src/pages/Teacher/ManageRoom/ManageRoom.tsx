import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { ParsedGIFTQuestion, BaseQuestion, parse, Question } from 'gift-pegjs';
import {
    isSimpleNumericalAnswer,
    isRangeNumericalAnswer,
    isHighLowNumericalAnswer
} from 'gift-pegjs/typeGuards';
import LiveResultsComponent from 'src/components/LiveResults/LiveResults';
import webSocketService, {
    AnswerReceptionFromBackendType
} from '../../../services/WebsocketService';
import { QuizType } from '../../../Types/QuizType';
import GroupIcon from '@mui/icons-material/Group';
import './manageRoom.css';
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
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';

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
    const [isQuestionShown, setIsQuestionShown] = useState<boolean>(quizMode === 'student' ? false : true);

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
        setIsQuestionShown(quizMode === 'student' ? false : true);
    }, [quizMode]);

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
        webSocketService.nextQuestion({
            roomName: formattedRoomName,
            questions: quizQuestions,
            questionIndex: nextQuestionIndex,
            isLaunch: false
        });
    };

    const previousQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const prevQuestionIndex = Number(currentQuestion?.question.id) - 2; // -2 because question.id starts at index 1

        if (prevQuestionIndex === undefined || prevQuestionIndex < 0) return;
        setCurrentQuestion(quizQuestions[prevQuestionIndex]);
        webSocketService.nextQuestion({ roomName: formattedRoomName, questions: quizQuestions, questionIndex: prevQuestionIndex, isLaunch: false });
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
        webSocketService.nextQuestion({ roomName: formattedRoomName, questions: quizQuestions, questionIndex: 0, isLaunch: true });
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
                webSocketService.nextQuestion({ roomName: formattedRoomName, questions: quizQuestions, questionIndex, isLaunch: false });
            }
            setIsQuestionShown(true);
        }

    };

    const handleReturn = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard');
    };

    function checkIfIsCorrect(
        answer: AnswerType,
        idQuestion: number,
        questions: QuestionType[]
    ): boolean {
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
                            answerNumber <= choice.numberHigh && answerNumber >= choice.numberLow
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

    if (!formattedRoomName) {
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
        <div className="room">
            <h1>Salle : {formattedRoomName}</h1>
            <div className="roomHeader">
                <DisconnectButton
                    onReturn={handleReturn}
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter?`}
                />

                <div
                    className="headerContent"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                    }}
                >
                    {(
                        <div
                            className="userCount subtitle smallText"
                            style={{ display: "flex", justifyContent: "flex-end" }}
                        >
                            <GroupIcon style={{ marginRight: '5px' }} />
                            {students.length}/60
                        </div>
                    )}
                </div>

                <div className="dumb"></div>
            </div>

            {/* the following breaks the css (if 'room' classes are nested) */}
            <div className="">

                {quizQuestions ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="title center-h-align mb-2">{quiz?.title}</div>
                        {(quizMode === 'student' && isQuestionShown) && (
                            <div className='close-button-wrapper'>
                                <Button
                                    className="close-button"
                                    onClick={() => {
                                        setIsQuestionShown(false);
                                    }} >
                                    ✖
                                </Button>
                            </div>
                        )}
                        {!isNaN(Number(currentQuestion?.question.id))
                            && isQuestionShown && (
                                <strong className="number of questions">
                                    Question {Number(currentQuestion?.question.id)}/
                                    {quizQuestions?.length}
                                </strong>
                            )
                        }

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
                                {currentQuestion && isQuestionShown && (
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
                            <div
                                className="questionNavigationButtons"
                                style={{ display: 'flex', justifyContent: 'center' }}
                            >
                                <div className="previousQuestionButton">
                                    <Button
                                        onClick={previousQuestion}
                                        variant="contained"
                                        disabled={Number(currentQuestion?.question.id) <= 1}
                                    >
                                        Question précédente
                                    </Button>
                                </div>
                                <div className="nextQuestionButton">
                                    <Button
                                        onClick={nextQuestion}
                                        variant="contained"
                                        disabled={
                                            Number(currentQuestion?.question.id) >=
                                            quizQuestions.length
                                        }
                                    >
                                        Prochaine question
                                    </Button>
                                </div>
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
        </div>
    );
};

export default ManageRoom;
