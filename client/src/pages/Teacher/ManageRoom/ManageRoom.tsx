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
import './manageRoom.css';
import QRCodeIcon from '@mui/icons-material/QrCode';
import { ENV_VARIABLES } from 'src/constants';
import { StudentType, Answer } from '../../../Types/StudentType';
import LoadingCircle from 'src/components/LoadingCircle/LoadingCircle';
import { Refresh, Error } from '@mui/icons-material';
import StudentWaitPage from 'src/components/StudentWaitPage/StudentWaitPage';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import QuestionDisplay from 'src/components/QuestionsDisplay/QuestionDisplay';
import ApiService from '../../../services/ApiService';
import { QuestionType } from 'src/Types/QuestionType';
import { Button, FormControlLabel, Switch } from '@mui/material';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { checkIfIsCorrect } from './useRooms';
import { QRCodeCanvas } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ManageRoom: React.FC = () => {
    const navigate = useNavigate();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [students, setStudents] = useState<StudentType[]>([]);
    const { quizId = '', roomName = '' } = useParams<{ quizId: string, roomName: string }>();
    const { quizId = '', roomName = '' } = useParams<{ quizId: string; roomName: string }>();
    const [quizQuestions, setQuizQuestions] = useState<QuestionType[] | undefined>();
    const [quiz, setQuiz] = useState<QuizType | null>(null);
    const [quizMode, setQuizMode] = useState<'teacher' | 'student'>('teacher');
    const [connectingError, setConnectingError] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionType | undefined>(undefined);
    const [quizStarted, setQuizStarted] = useState<boolean>(false);
    const [formattedRoomName, setFormattedRoomName] = useState('');
    const [newlyConnectedUser, setNewlyConnectedUser] = useState<StudentType | null>(null);
    const roomUrl = `${window.location.origin}/student/join-room?roomName=${roomName}`;
    const [showQrModal, setShowQrModal] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(roomUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
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
        if (!roomName) {
            console.error('Room name is missing!');
            return;
        }

        console.log(`Joining room: ${roomName}`);
    }, [roomName]);

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
        webSocketService.nextQuestion({
            roomName: formattedRoomName,
            questions: quizQuestions,
            questionIndex: prevQuestionIndex,
            isLaunch: false
        });
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
        webSocketService.nextQuestion({
            roomName: formattedRoomName,
            questions: quizQuestions,
            questionIndex: 0,
            isLaunch: true
        });
    };

    const launchStudentMode = () => {
        const quizQuestions = initializeQuizQuestion();
        console.log('launchStudentMode - quizQuestions:', quizQuestions);

        if (!quizQuestions) {
            console.log('Error launching quiz (launchStudentMode). No questions found.');
            return;
        }
        setQuizQuestions(quizQuestions);
        setCurrentQuestion(quizQuestions[0]);
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
                webSocketService.nextQuestion({
                    roomName: formattedRoomName,
                    questions: quizQuestions,
                    questionIndex,
                    isLaunch: false
                });
            }
            setIsQuestionShown(true);
        }
    };

    const finishQuiz = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard');
    };

    const handleReturn = () => {
        disconnectWebSocket();
        navigate('/teacher/dashboard');
    };

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
            {/* En-tête avec bouton Disconnect à gauche et QR code à droite */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
                }}
            >
                <DisconnectButton
                    onReturn={handleReturn}
                    askConfirm
                    message={`Êtes-vous sûr de vouloir quitter?`}
                />

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => setShowQrModal(true)}
                    startIcon={<QRCodeIcon />}
                >
                    Lien de participation
                </Button>
            </div>

            <Dialog
                open={showQrModal}
                onClose={() => setShowQrModal(false)}
                aria-labelledby="qr-modal-title"
            >
                <DialogTitle id="qr-modal-title">
                    Rejoindre la salle: {formattedRoomName}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Scannez ce QR code ou partagez le lien ci-dessous pour rejoindre la salle :
                    </DialogContentText>

                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        <QRCodeCanvas value={roomUrl} size={256} />
                    </div>

                    <div style={{ wordBreak: 'break-all', textAlign: 'center' }}>
                        <h3>URL de participation :</h3>
                        <p>{roomUrl}</p>
                        <Button
                            variant="contained"
                            startIcon={<ContentCopyIcon />}
                            onClick={handleCopy}
                            style={{ marginTop: '10px' }}
                        >
                            {copied ? 'Copié !' : 'Copier le lien'}
                        </Button>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowQrModal(false)} color="primary">
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            <div className="roomHeader">
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: '100%',
                        marginBottom: '10px'
                    }}
                >
                    <h1 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
                        Salle : {formattedRoomName}
                        <div
                            className="userCount subtitle"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                marginLeft: '20px',
                                marginBottom: '0px'
                            }}
                        >
                            <GroupIcon style={{ marginRight: '5px', verticalAlign: 'middle' }} />{' '}
                            {students.length}/60
                        </div>
                    </h1>
                </div>

                <div className="dumb"></div>
            </div>

            {/* the following breaks the css (if 'room' classes are nested) */}
            <div className="">

                {quizQuestions ? (

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="title center-h-align mb-2">{quiz?.title}</div>
                        
                    <div className='close-button-wrapper'>
                    <FormControlLabel
                        label={<div className="text-sm">Afficher les questions</div>}
                        control={
                            <Switch
                                data-testid="question-visibility-switch" // Add a unique test ID
                                checked={isQuestionShown}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setIsQuestionShown(e.target.checked)
                                }
                            />
                        }
                    />
                    </div>
                    
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
                        <div className="finishQuizButton">
                            <Button onClick={finishQuiz} variant="contained">
                                Terminer le quiz
                            </Button>
                        </div>
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
