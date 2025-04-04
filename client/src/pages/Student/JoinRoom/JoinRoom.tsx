import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';
import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import webSocketService, { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';
import { QuestionType } from '../../../Types/QuestionType';
import { TextField, Button, CircularProgress } from '@mui/material';
import LoginContainer from 'src/components/LoginContainer/LoginContainer';
import ApiService from '../../../services/ApiService';
import 'bootstrap/dist/css/bootstrap.min.css';

export type AnswerType = Array<string | number | boolean>;

const JoinRoom: React.FC = () => {
    const [roomName, setRoomName] = useState('');
    const [username, setUsername] = useState(ApiService.getUsername());
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isWaitingForTeacher, setIsWaitingForTeacher] = useState(false);
    const [question, setQuestion] = useState<QuestionType>();
    const [quizMode, setQuizMode] = useState<string>();
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [answers, setAnswers] = useState<AnswerSubmissionToBackendType[]>([]);
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        handleCreateSocket();
        return () => {
            disconnect();
        };
    }, []);

    useEffect(() => {
        setAnswers(questions ? Array(questions.length).fill({} as AnswerSubmissionToBackendType) : []);
    }, [questions]);

    const handleCreateSocket = () => {
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);

        socket.on('join-success', () => {
            setIsWaitingForTeacher(true);
            setIsConnecting(false);
        });

        socket.on('next-question', (question: QuestionType) => {
            setQuizMode('teacher');
            setIsWaitingForTeacher(false);
            setQuestion(question);
        });

        socket.on('launch-teacher-mode', (questions: QuestionType[]) => {
            setQuizMode('teacher');
            setIsWaitingForTeacher(true);
            setQuestions([]);
            setQuestions(questions);
        });

        socket.on('launch-student-mode', (questions: QuestionType[]) => {
            setQuizMode('student');
            setIsWaitingForTeacher(false);
            setQuestions([]);
            setQuestions(questions);
            setQuestion(questions[0]);
        });

        socket.on('end-quiz', () => {
            disconnect();
        });

        socket.on('join-failure', (message) => {
            setConnectionError(`Erreur de connexion : ${message}`);
            setIsConnecting(false);
        });

        socket.on('connect_error', (error) => {
            switch (error.message) {
                case 'timeout':
                    setConnectionError("Le serveur n'est pas disponible");
                    break;
                case 'websocket error':
                    setConnectionError("Le serveur n'est pas disponible");
                    break;
            }
            setIsConnecting(false);
        });

        setSocket(socket);
    };

    const disconnect = () => {
        webSocketService.disconnect();
        setSocket(null);
        setQuestion(undefined);
        setIsWaitingForTeacher(false);
        setQuizMode('');
        setRoomName('');
        setUsername('');
        setIsConnecting(false);
    };

    const handleSocket = () => {
        setIsConnecting(true);
        setConnectionError('');
        if (!socket?.connected) {
            handleCreateSocket();
        }

        if (username && roomName) {
            webSocketService.joinRoom(roomName, username);
        }
    };

    const handleOnSubmitAnswer = (answer: AnswerType, idQuestion: number) => {
        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: idQuestion
        };
        setAnswers((prevAnswers) => {
            const newAnswers = [...prevAnswers];
            newAnswers[idQuestion - 1] = answerData;
            return newAnswers;
        });
        webSocketService.submitAnswer(answerData);
    };

    const handleReturnKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && username && roomName) {
            handleSocket();
        }
    };

    if (isWaitingForTeacher) {
        return (
            <div className="d-flex flex-column vh-100">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <DisconnectButton
                        onReturn={disconnect}
                        message={`Êtes-vous sûr de vouloir quitter?`} />

                    <div className="text-center">
                        <h2 className="mb-1">Salle: {roomName}</h2>
                        <p className="text-muted mb-0">
                            En attente que le professeur lance le questionnaire...
                        </p>
                    </div>

                    <div style={{ width: '48px' }}></div> {/* Spacer for balance */}
                </div>
            </div>
        );
    }

    switch (quizMode) {
        case 'student':
            return (
                <StudentModeQuiz
                    questions={questions}
                    answers={answers}
                    submitAnswer={handleOnSubmitAnswer}
                    disconnectWebSocket={disconnect}
                />
            );
        case 'teacher':
            return (
                question && (
                    <TeacherModeQuiz
                        questionInfos={question}
                        answers={answers}
                        submitAnswer={handleOnSubmitAnswer}
                        disconnectWebSocket={disconnect}
                    />
                )
            );
        default:
            return (
                <LoginContainer title='Rejoindre une salle' error={connectionError}>
                    <TextField
                        type="text"
                        label="Nom de la salle"
                        variant="outlined"
                        className="mb-3 w-100"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                        placeholder="Nom de la salle"
                        fullWidth
                        onKeyDown={handleReturnKey}
                    />

                    <TextField
                        label="Nom d'utilisateur"
                        variant="outlined"
                        className="mb-3 w-100"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                        fullWidth
                        onKeyDown={handleReturnKey}
                    />

                    <Button
                        variant="contained"
                        className="w-100"
                        onClick={handleSocket}
                        disabled={!username || !roomName || isConnecting}
                        startIcon={isConnecting ? <CircularProgress size={20} /> : null}
                    >
                        Rejoindre
                    </Button>
                </LoginContainer>
            );
    }
};

export default JoinRoom;