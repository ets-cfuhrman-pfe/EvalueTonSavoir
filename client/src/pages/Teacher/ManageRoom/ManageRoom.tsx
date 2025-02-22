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
import { RoomType } from 'src/Types/RoomType';
import { Button, NativeSelect } from '@mui/material';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';

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
    const [quizStarted, setQuizStarted] = useState(false);
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [selectedRoomId, setSelectedRoomId] = useState<string>('');
    const [openDialog, setOpenDialog] = useState(false);
    const [newRoomTitle, setNewRoomTitle] = useState('');
    const [isRoomSelectionVisible, setIsRoomSelectionVisible] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!ApiService.isLoggedIn()) {
                navigate('/teacher/login');
                return;
            }

            const userRooms = await ApiService.getUserRooms();
            setRooms(userRooms as RoomType[]);
        };

        fetchData();
    }, []);

    const handleSelectRoom = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const roomId = event.target.value;
        setSelectedRoomId(roomId);

        const selectedRoom = rooms.find((room) => room._id === roomId);
        setRoomName(selectedRoom?.title || '');
    };

    useEffect(() => {
        if (rooms.length > 0 && !selectedRoomId) {
            setSelectedRoomId(rooms[0]._id);
        }
    }, [rooms]);

    const handleDialogClose = () => {
        setOpenDialog(false);
    };

    const handleCreateRoom = async () => {
        setOpenDialog(true);
    };
    const handleSubmitRoom = async () => {
        try {
            if (newRoomTitle.trim()) {
                const createdRoom = await ApiService.createRoom(newRoomTitle);

                const updatedRooms = await ApiService.getUserRooms();
                setRooms(updatedRooms as RoomType[]);

                if (createdRoom) {
                    setSelectedRoomId(createdRoom);
                }
                setOpenDialog(false);
                setNewRoomTitle('');
            }
        } catch (error) {
            console.error('Error creating Room::', error);
        }
    };

    useEffect(() => {
        if (quizId.id) {
            const fetchquiz = async () => {
                const quiz = await ApiService.getQuiz(quizId.id as string);

                if (!quiz) {
                    window.alert(
                        `Une erreur est survenue.\n Le quiz ${quizId.id} n'a pas été trouvé\nVeuillez réessayer plus tard`
                    );
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
            window.alert(
                `Une erreur est survenue.\n Le quiz ${quizId.id} n'a pas été trouvé\nVeuillez réessayer plus tard`
            );
            console.error('Quiz not found for id:', quizId.id);
            navigate('/teacher/dashboard');
            return;
        }
    }, [quizId]);

    useEffect(() => {
        if (rooms.length > 0 && !selectedRoomId) {
            setSelectedRoomId(rooms[0].title);
        }
    }, [rooms]);

    useEffect(() => {
        if (!newRoomTitle && !selectedRoomId) {
            setConnectingError('Aucun nom de salle sélectionné ou créé.');
        }
    }, [newRoomTitle, selectedRoomId]);

    useEffect(() => {
        if (selectedRoomId && selectedRoomId.trim() !== '') {
            console.log(`Sélection d'une nouvelle salle: ${selectedRoomId}`);
            createWebSocketRoom();
        }
    }, [selectedRoomId]);

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
    
        const handleRoomCreation = (socket: Socket, roomToCreate?: string) => {
            socket.on('connect', () => {
                if (roomToCreate) {
                    webSocketService.createRoom(roomToCreate);
                } else {
                    socket.emit("create-room");
                }
            });
    
            socket.on('create-success', (createdRoomName: string) => {
                console.log('Salle créée/jointe:', createdRoomName);
                setRoomName(createdRoomName);
            });
    
            socket.on('create-failure', (errorMessage: string) => {
                setConnectingError(errorMessage);
                console.error('Erreur création salle:', errorMessage);
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
        };
    
        if (rooms.length === 0) {
            console.log('Tentative de création de salle automatique...');
            const newSocket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_SOCKET_URL);
            handleRoomCreation(newSocket);
            setSocket(newSocket);
        } else {
            const targetRoom = rooms.find((room) => room._id === selectedRoomId) || rooms[0];
            if (!targetRoom) {
                setConnectingError('Aucune salle disponible');
                return;
            }
    
            console.log('Utilisation de la salle:', targetRoom.title);
            const newSocket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_SOCKET_URL);
            handleRoomCreation(newSocket, targetRoom.title);
            setSocket(newSocket);
        }

        socket?.on('connect_error', (error) => {
            setConnectingError('Erreur de connexion au serveur...');
            console.error('Connection error:', error);
        });
    };

    useEffect(() => {
        // This is here to make sure the correct value is sent when user join
        if (socket) {
            console.log(`Listening for user-joined in room ${roomName}`);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            socket.on('user-joined', (_student: StudentType) => {
                console.log("📢 Nouvel étudiant ajouté:", _student);
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
                console.log(
                    `Received answer from ${username} for question ${idQuestion}: ${answer}`
                );
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
                            const existingAnswer = student.answers.find(
                                (ans) => ans.idQuestion === idQuestion
                            );
                            let updatedAnswers: Answer[] = [];
                            if (existingAnswer) {
                                // Update the existing answer
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
                                // Add a new answer
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
            console.log(
                `Error launching quiz. socket: ${socket}, roomName: ${roomName}, quiz: ${quiz}`
            );
            setQuizStarted(true);

            return;
        }
        switch (quizMode) {
            case 'student':
                setQuizStarted(true);
                return launchStudentMode();
            case 'teacher':
                setQuizStarted(true);
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

    function checkIfIsCorrect(
        answer: string | number | boolean,
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
        <div className="room">
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
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <div className="title">Salle: {roomName}</div>
                    </div>
                    {quizStarted && (
                        <div
                            className="userCount subtitle smallText"
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <GroupIcon style={{ marginRight: '5px' }} />
                            {students.length}/60
                        </div>
                    )}
                </div>

                <div className="dumb"></div>
            </div>
            {isRoomSelectionVisible && (
                <div className="roomSelection">
                    <div className="select">
                        <NativeSelect
                            id="select-room"
                            color="primary"
                            value={selectedRoomId}
                            onChange={handleSelectRoom}
                        >
                            <option value=""> Sélectionner une salle </option>
                            {rooms.map((room: RoomType) => (
                                <option value={room._id} key={room._id}>
                                    {' '}
                                    {room.title}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>

                    <div
                        className="actions"
                        style={{ display: 'flex', justifyContent: 'flex-end' }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateRoom}
                            style={{
                                width: 'auto',
                                marginLeft: '30px',
                                height: '40px',
                                padding: '0 20px'
                            }}
                        >
                            Ajouter une nouvelle salle
                        </Button>
                    </div>

                    {/* Dialog pour créer une salle */}
                    <Dialog open={openDialog} onClose={handleDialogClose} maxWidth="sm" fullWidth>
                        <DialogTitle>Créer une nouvelle salle</DialogTitle>
                        <DialogContent>
                            <TextField
                                autoFocus
                                margin="dense"
                                label="Titre de la salle"
                                type="text"
                                fullWidth
                                value={newRoomTitle}
                                onChange={(e) => setNewRoomTitle(e.target.value)}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDialogClose} color="secondary">
                                Annuler
                            </Button>
                            <Button onClick={handleSubmitRoom} color="primary">
                                Créer
                            </Button>
                        </DialogActions>
                    </Dialog>
                </div>
            )}

            {/* the following breaks the css (if 'room' classes are nested) */}
            <div className="">
                {quizQuestions ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div className="title center-h-align mb-2">{quiz?.title}</div>
                        {!isNaN(Number(currentQuestion?.question.id)) && (
                            <strong className="number of questions">
                                Question {Number(currentQuestion?.question.id)}/
                                {quizQuestions?.length}
                            </strong>
                        )}

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
                        setIsRoomSelectionVisible={setIsRoomSelectionVisible}
                    />
                )}
            </div>
        </div>
    );
};

export default ManageRoom;
