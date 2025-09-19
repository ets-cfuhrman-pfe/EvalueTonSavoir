import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Socket } from 'socket.io-client';
import { BaseQuestion, parse, Question } from 'gift-pegjs';
import LiveResultsComponent from 'src/components/LiveResults/LiveResultsV2';
import webSocketService, {
    AnswerReceptionFromBackendType
} from '../../../services/WebsocketService';
import { QuizType } from '../../../Types/QuizType';
import { ENV_VARIABLES } from 'src/constants';
import { StudentType, Answer } from '../../../Types/StudentType';
import LoadingCircle from 'src/components/LoadingCircle/LoadingCircle';

import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import ApiService from '../../../services/ApiService';
import { QuestionType } from 'src/Types/QuestionType';
import { checkIfIsCorrect } from './useRooms';
import { RoomType } from '../../../Types/RoomType';
import {
    Button,
    Alert,
    Card,
    CardContent,
    Typography,
    Box
} from '@mui/material';
import {
    ArrowBack,
    QrCode,
    ChevronLeft,
    ChevronRight,
    Stop,
    Refresh
} from '@mui/icons-material';
import QRCodeModal from '../../../components/QRCodeModal';
import './manageRoom.css';

const ManageRoomV2: React.FC = () => {
    const navigate = useNavigate();
    const { quizId = '' } = useParams<{ quizId: string }>();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [students, setStudents] = useState<StudentType[]>([]);
    const [quizQuestions, setQuizQuestions] = useState<QuestionType[] | undefined>();
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [quizMode, setQuizMode] = useState<'teacher' | 'student'>('teacher');
    const [connectingError, setConnectingError] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | undefined>(undefined);
    const [quizStarted, setQuizStarted] = useState<boolean>(false);
    const [formattedRoomName, setFormattedRoomName] = useState('');
    const [newlyConnectedUser, setNewlyConnectedUser] = useState<StudentType | null>(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [previewRoomName, setPreviewRoomName] = useState('');

    // Room selection states
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');

    const [showQuestions, setShowQuestions] = useState(true);
    const [showResults, setShowResults] = useState(true);

    const roomUrl = `${window.location.origin}/student/join-room-v2?roomName=${previewRoomName || formattedRoomName}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(roomUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Handle the newly connected user in useEffect, because it needs state info
    // not available in the socket.on() callback
    useEffect(() => {
        if (newlyConnectedUser) {
            // console.log(`Handling newly connected user: ${newlyConnectedUser.name}`);
            setStudents((prevStudents) => [...prevStudents, newlyConnectedUser]);

            // only send nextQuestion if the quiz has started
            if (!quizStarted) {
                // console.log(`!quizStarted: returning.... `);
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
            }
        };

        verifyLogin();
    }, []);

    useEffect(() => {
        if (quizId) {
            const fetchQuiz = async () => {
                const quiz = await ApiService.getQuiz(quizId);

                if (!quiz) {
                    alert(
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
            alert(
                `Une erreur est survenue.\n Le quiz n'a pas été spécifié\nVeuillez réessayer plus tard`
            );
            console.error('Quiz ID not provided');
            navigate('/teacher/dashboard');
        }
    }, [quizId]);

    // Fetch rooms when component mounts and auto-launch
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const userRooms = await ApiService.getUserRooms();
                if (Array.isArray(userRooms)) {
                    setRooms(userRooms);

                    // Set default to latest used room
                    const latestRoomId = localStorage.getItem('selectedRoomId');

                    if (latestRoomId && userRooms.some((room) => room._id === latestRoomId)) {
                        setSelectedRoomId(latestRoomId);
                    } else if (userRooms.length > 0) {
                        setSelectedRoomId(userRooms[userRooms.length - 1]._id);
                    }

                    // Don't auto-launch here, let the separate useEffect handle it
                } else {
                    console.error('Error fetching rooms:', userRooms);
                    setRooms([]);
                }
            } catch (error) {
                console.error('Error fetching user rooms:', error);
            }
        };

        fetchRooms();
    }, []);

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

    const createWebSocketRoom = (roomName: string) => {
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);
        const roomNameUpper = roomName.toUpperCase();
        setFormattedRoomName(roomNameUpper);
        // console.log(`Creating WebSocket room named ${roomNameUpper}`);

        socket.on('connect', () => {
            webSocketService.createRoom(roomNameUpper);
        });

        socket.on('connect_error', (error) => {
            setConnectingError('Erreur lors de la connexion... Veuillez réessayer');
            console.error('ManageRoomV2: WebSocket connection error:', error);
        });

        socket.on('user-joined', (student: StudentType) => {
            setNewlyConnectedUser(student);
        });

        socket.on('join-failure', (message) => {
            setConnectingError(message);
            setSocket(null);
        });

        socket.on('user-disconnected', (userId: string) => {
            // console.log(`Student left: id = ${userId}`);
            setStudents((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        });

        setSocket(socket);
    };

    useEffect(() => {
        if (socket) {
            // console.log(`Listening for submit-answer-room in room ${formattedRoomName}`);
            socket.on('submit-answer-room', (answerData: AnswerReceptionFromBackendType) => {
                const { answer, idQuestion, idUser, username } = answerData;
                //  console.log(`Received answer from ${username} for question ${idQuestion}: ${answer}`);
                if (!quizQuestions) {
                    console.log('Quiz questions not found (cannot update answers without them).');
                    return;
                }

                setStudents((prevStudents) => {
                    let foundStudent = false;
                    const updatedStudents = prevStudents.map((student) => {
                        if (student.id === idUser) {
                            foundStudent = true;
                            const existingAnswer = student.answers.find(
                                (ans) => ans.idQuestion === idQuestion
                            );
                            let updatedAnswers: Answer[] = [];
                            if (existingAnswer) {
                                updatedAnswers = student.answers.map((ans) => {
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
        }
    }, [socket, currentQuestion, quizQuestions]);

    // Auto-launch quiz when socket is connected and room is created
    useEffect(() => {
        if (socket && formattedRoomName && !quizStarted) {
            // Small delay to ensure WebSocket room is fully created
            const timer = setTimeout(() => {
                launchQuiz();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [socket, formattedRoomName, quizStarted]);

    const nextQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const nextQuestionIndex = Number(currentQuestion?.question.id);

        if (nextQuestionIndex === undefined || nextQuestionIndex > quizQuestions.length - 1) return;

        setCurrentQuestion(quizQuestions[nextQuestionIndex]);

        // Only send WebSocket update in teacher mode
        if (quizMode === 'teacher') {
            webSocketService.nextQuestion({
                roomName: formattedRoomName,
                questions: quizQuestions,
                questionIndex: nextQuestionIndex,
                isLaunch: false
            });
        }
    };

    const previousQuestion = () => {
        if (!quizQuestions || !currentQuestion || !quiz?.content) return;

        const prevQuestionIndex = Number(currentQuestion?.question.id) - 2;

        if (prevQuestionIndex === undefined || prevQuestionIndex < 0) return;
        setCurrentQuestion(quizQuestions[prevQuestionIndex]);

        // Only send WebSocket update in teacher mode
        if (quizMode === 'teacher') {
            webSocketService.nextQuestion({
                roomName: formattedRoomName,
                questions: quizQuestions,
                questionIndex: prevQuestionIndex,
                isLaunch: false
            });
        }
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
        // console.log('launchTeacherMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchTeacherMode). No questions found.');
            return;
        }

        setCurrentQuestion(quizQuestions[0]);
        webSocketService.nextQuestion({
            roomName: formattedRoomName,
            questions: quizQuestions,
            questionIndex: 0,
            isLaunch: true
        });
    };

    const launchStudentMode = () => {
        const quizQuestions = initializeQuizQuestion();
        // console.log('launchStudentMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchStudentMode). No questions found.');
            return;
        }
        setQuizQuestions(quizQuestions);
        // Set the first question as current question so it displays in student mode
        setCurrentQuestion(quizQuestions[0]);
        webSocketService.launchStudentModeQuiz(formattedRoomName, quizQuestions);
    };

    const launchQuiz = () => {
        setQuizStarted(true);
        if (!socket || !formattedRoomName || !quiz?.content || quiz?.content.length === 0) {
            console.log(
                `Error launching quiz. socket: ${socket}, roomName: ${formattedRoomName}, quiz: ${quiz}`
            );
            return;
        }
        // console.log(`Launching quiz in ${quizMode} mode...`);
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
                webSocketService.nextQuestion({
                    roomName: formattedRoomName,
                    questions: quizQuestions,
                    questionIndex,
                    isLaunch: false
                });
            }
        }
    };

    const finishQuiz = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard-v2');
    };

    const handleReturn = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard-v2');
    };

    const handleLaunchQuiz = () => {
        if (!selectedRoomId) {
            alert('Veuillez sélectionner une salle');
            return;
        }

        const selectedRoom = rooms.find((room) => room._id === selectedRoomId);
        if (!selectedRoom) {
            alert('Salle non trouvée');
            return;
        }

        // Store selected room for future use
        localStorage.setItem('selectedRoomId', selectedRoomId);

        // Create WebSocket room and launch quiz immediately
        createWebSocketRoom(selectedRoom.title);
    };

    if (!quiz) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <LoadingCircle text="Chargement du quiz..." />
            </div>
        );
    }

    // Initial quiz launch screen with all options
    if (!formattedRoomName) {
        return (
            <div className="content-container">
                <div className="container-fluid p-0">
                    {/* Top Header */}
                    <div className="bg-white border-bottom shadow-sm">
                        <div className="container-fluid px-4 py-3">
                            <div className="d-flex justify-content-between align-items-center px-4">
                                <div className="d-flex flex-column align-items-start">
                                    <h1 className="h3 mb-3 text-dark fw-bold">
                                        Options de lancement du quiz
                                    </h1>
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={handleReturn}
                                    >
                                        <ArrowBack className="me-2" style={{ fontSize: '1rem' }} />
                                        Retour au tableau de bord
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="container-fluid px-4 py-4">
                        <div className="row justify-content-center">
                            <div className="col-lg-8 col-md-10">
                                {/* Quiz Info Card */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-body text-center py-4">
                                        <h2 className="card-title h2 mb-2">{quiz.title}</h2>
                                        <p className="text-muted h4 mb-0">
                                            {quiz.content ? quiz.content.length : 0} question(s)
                                        </p>
                                    </div>
                                </div>

                                {/* Launch Button */}
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center fs-4 mb-4"
                                        onClick={handleLaunchQuiz}
                                        disabled={!selectedRoomId}
                                    >
                                        Lancer le quiz
                                    </button>
                                </div>
                                {/* Room Selection Card */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-light">
                                        <h5 className="card-title mb-0">
                                            1. Sélectionner une salle
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="mb-3">
                                            <label htmlFor="roomSelect" className="form-label">
                                                Choisir une salle existante:
                                            </label>
                                            <select
                                                id="roomSelect"
                                                className="form-select"
                                                value={selectedRoomId}
                                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                            >
                                                <option value="">
                                                    -- Sélectionner une salle --
                                                </option>
                                                {rooms.length === 0 ? (
                                                    <option disabled>
                                                        Aucune salle disponible
                                                    </option>
                                                ) : (
                                                    rooms.map((room) => (
                                                        <option key={room._id} value={room._id}>
                                                            {room.title}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Quiz Mode Selection Card */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-light">
                                        <h5 className="card-title mb-0">2. Rythme du quiz</h5>
                                    </div>
                                    <div className="card-body">
                                        <div className="form-check mb-3">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="quizMode"
                                                id="teacherMode"
                                                value="teacher"
                                                checked={quizMode === 'teacher'}
                                                onChange={(e) =>
                                                    setQuizMode(
                                                        e.target.value as 'teacher' | 'student'
                                                    )
                                                }
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="teacherMode"
                                            >
                                                <strong>Rythme du professeur</strong>
                                                <div className="text-muted small">
                                                    Le professeur contrôle le passage d'une question
                                                    à l'autre
                                                </div>
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="quizMode"
                                                id="studentMode"
                                                value="student"
                                                checked={quizMode === 'student'}
                                                onChange={(e) =>
                                                    setQuizMode(
                                                        e.target.value as 'teacher' | 'student'
                                                    )
                                                }
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="studentMode"
                                            >
                                                <strong>Rythme de l'étudiant</strong>
                                                <div className="text-muted small">
                                                    Les étudiants avancent à leur propre rythme
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Launch Button */}
                                <div className="d-grid">
                                    <button
                                        className="btn btn-primary w-100 d-flex align-items-center justify-content-center fs-4"
                                        onClick={handleLaunchQuiz}
                                        disabled={!selectedRoomId}
                                    >
                                        Lancer le quiz
                                    </button>
                                </div>
                                {!selectedRoomId && (
                                    <div className="alert alert-warning mt-3 mb-0">
                                        <small>
                                            Veuillez sélectionner une salle pour continuer.
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Modal */}
                <QRCodeModal
                    open={showQrModal}
                    onClose={() => {
                        setShowQrModal(false);
                        setPreviewRoomName('');
                    }}
                    roomName={previewRoomName || formattedRoomName}
                    roomUrl={roomUrl}
                    copied={copied}
                    onCopy={handleCopy}
                />
            </div>
        );
    }

    // Show connection error if there's one
    if (connectingError) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <Box textAlign="center" maxWidth={400}>
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {connectingError}
                    </Alert>
                    <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={() => {
                            setConnectingError('');
                            const selectedRoom = rooms.find((room) => room._id === selectedRoomId);
                            if (selectedRoom) {
                                createWebSocketRoom(selectedRoom.title);
                            }
                        }}
                    >
                        Reconnecter
                    </Button>
                </Box>
            </div>
        );
    }

    // Main room management interface
    return (
        <>
            <div className="content-container">
                <div className="w-100 p-0 content-full-width">
                    {/* Top Header */}
                    <div className="bg-white border-bottom shadow-sm">
                        <div className="container-fluid px-2 py-4 content-full-width">
                            <div className="d-flex px-3 justify-content-between align-items-center">
                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBack />}
                                    onClick={handleReturn}
                                >
                                    Quitter
                                </Button>

                                <Box textAlign="center">
                                    <Typography variant="h5" component="h1" fontWeight="bold">
                                        Salle: {formattedRoomName}
                                    </Typography>
                                    <Typography variant="h6" color="text.secondary">
                                        {students.length}/60 participants
                                    </Typography>
                                </Box>

                                <Button
                                    variant="contained"
                                    startIcon={<QrCode />}
                                    onClick={() => setShowQrModal(true)}
                                >
                                    Lien de participation
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="row g-0">
                        <div className="col-12 bg-white shadow-sm">
                            <div className="p-4">
                                {quizQuestions ? (
                                    <div>
                                        <Box display="flex" justifyContent="left" gap={2} mb={2}>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setShowQuestions(!showQuestions)}
                                            >
                                                {showQuestions
                                                    ? 'Masquer les questions'
                                                    : 'Afficher les questions'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setShowResults(!showResults)}
                                            >
                                                {showResults
                                                    ? 'Masquer les résultats'
                                                    : 'Afficher les résultats'}
                                            </Button>
                                        </Box>

                                        <Box display="flex" flexDirection="column" gap={3}>
                                            {/* Results Box */}
                                            {showResults && (
                                                <Box width="100%">
                                                    <LiveResultsComponent
                                                        quizMode={quizMode}
                                                        socket={socket}
                                                        questions={quizQuestions}
                                                        showSelectedQuestion={showSelectedQuestion}
                                                        students={students}
                                                        quizTitle={quiz?.title}
                                                    />
                                                </Box>
                                            )}
                                            {/* Questions Box */}
                                            {showQuestions && (
                                                <Box width="100%">
                                                    {/* Navigation buttons for questions */}

                                                    <Box
                                                        display="flex"
                                                        justifyContent="center"
                                                        gap={2}
                                                        mb={3}
                                                    >
                                                        <Button
                                                            variant="outlined"
                                                            startIcon={<ChevronLeft />}
                                                            onClick={previousQuestion}
                                                            disabled={
                                                                Number(currentQuestion?.question.id) <=
                                                                1
                                                            }
                                                        >
                                                            Précédente
                                                        </Button>
                                                        <Button
                                                            variant="outlined"
                                                            endIcon={<ChevronRight />}
                                                            onClick={nextQuestion}
                                                            disabled={
                                                                Number(currentQuestion?.question.id) >=
                                                                quizQuestions.length
                                                            }
                                                        >
                                                            Suivante
                                                        </Button>
                                                    </Box>

                                                    {currentQuestion && (
                                                        <Card elevation={2}>
                                                            <CardContent>
                                                                <QuestionDisplay
                                                                    showAnswer={false}
                                                                    question={
                                                                        currentQuestion?.question as Question
                                                                    }
                                                                />
                                                            </CardContent>
                                                        </Card>
                                                    )}
                                                </Box>
                                            )}
                                        </Box>

                                        <Box textAlign="center" mt={4}>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="large"
                                                startIcon={<Stop />}
                                                onClick={finishQuiz}
                                            >
                                                Terminer le quiz
                                            </Button>
                                        </Box>
                                    </div>
                                ) : (
                                    <Box textAlign="center" py={8}>
                                        <LoadingCircle text="Préparation du quiz..." />
                                    </Box>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <QRCodeModal
                open={showQrModal}
                onClose={() => setShowQrModal(false)}
                roomName={formattedRoomName}
                roomUrl={roomUrl}
                copied={copied}
                onCopy={handleCopy}
            />
        </>
    );
};

export default ManageRoomV2;