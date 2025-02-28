import React, { useEffect, useState } from 'react';

import { Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';

import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import webSocketService, { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';

import './joinRoom.css';
import { QuestionType } from '../../../Types/QuestionType';
import { TextField } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';

import LoginContainer from 'src/components/LoginContainer/LoginContainer'

const JoinRoom: React.FC = () => {
    const [roomName, setRoomName] = useState('');
    const [username, setUsername] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isWaitingForTeacher, setIsWaitingForTeacher] = useState(false);
    const [question, setQuestion] = useState<QuestionType>();
    const [quizMode, setQuizMode] = useState<string>();
    const [questions, setQuestions] = useState<QuestionType[]>([]);
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        handleCreateSocket();
        return () => {
            disconnect();
        };
    }, []);

    const handleCreateSocket = () => {
        console.log(`JoinRoom: handleCreateSocket: ${ENV_VARIABLES.VITE_BACKEND_SOCKET_URL}`);
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_SOCKET_URL);

        socket.on('join-success', () => {
            setIsWaitingForTeacher(true);
            setIsConnecting(false);
            console.log('Successfully joined the room.');
        });
        socket.on('next-question', (question: QuestionType) => {
            setQuizMode('teacher');
            setIsWaitingForTeacher(false);
            setQuestion(question);
        });
        socket.on('launch-student-mode', (questions: QuestionType[]) => {
            setQuizMode('student');
            setIsWaitingForTeacher(false);
            setQuestions(questions);
            setQuestion(questions[0]);
        });
        socket.on('end-quiz', () => {
            disconnect();
        });
        socket.on('join-failure', (message) => {
            console.log('Failed to join the room.');
            setConnectionError(`Erreur de connexion : ${message}`);
            setIsConnecting(false);
        });
        socket.on('connect_error', (error) => {
            switch (error.message) {
                case 'timeout':
                    setConnectionError("JoinRoom: timeout: Le serveur n'est pas disponible");
                    break;
                case 'websocket error':
                    setConnectionError("JoinRoom: websocket error: Le serveur n'est pas disponible");
                    break;
            }
            setIsConnecting(false);
            console.log('Connection Error:', error.message);
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

    const handleOnSubmitAnswer = (answer: string | number | boolean, idQuestion: number) => {
        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: idQuestion
        };

        webSocketService.submitAnswer(answerData);
    };

    const handleReturnKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && username && roomName) {
            handleSocket();
        }
    };

    if (isWaitingForTeacher) {
        return (
            <div className='room'>
                <div className='roomHeader'>

                    <DisconnectButton
                        onReturn={disconnect}
                        message={`Êtes-vous sûr de vouloir quitter?`} />

                    <div className='centerTitle'>
                        <div className='title'>Salle: {roomName}</div>
                        <div className='userCount subtitle'>
                            En attente que le professeur lance le questionnaire...
                        </div>
                    </div>

                    <div className='dumb'></div>

                </div>
            </div>
        );
    }

    switch (quizMode) {
        case 'student':
            return (
                <StudentModeQuiz
                    questions={questions}
                    submitAnswer={handleOnSubmitAnswer}
                    disconnectWebSocket={disconnect}
                />
            );
        case 'teacher':
            return (
                question && (
                    <TeacherModeQuiz
                        questionInfos={question}
                        submitAnswer={handleOnSubmitAnswer}
                        disconnectWebSocket={disconnect}
                    />
                )
            );
        default:
            return (
                <LoginContainer
                    title='Rejoindre une salle'
                    error={connectionError}>

                    <TextField
                        type="number"
                        label="Numéro de la salle"
                        variant="outlined"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Numéro de la salle"
                        sx={{ marginBottom: '1rem' }}
                        fullWidth={true}
                        onKeyDown={handleReturnKey}
                    />

                    <TextField
                        label="Nom d'utilisateur"
                        variant="outlined"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nom d'utilisateur"
                        sx={{ marginBottom: '1rem' }}
                        fullWidth={true}
                        onKeyDown={handleReturnKey}
                    />

                    <LoadingButton
                        loading={isConnecting}
                        onClick={handleSocket}
                        variant="contained"
                        sx={{ marginBottom: `${connectionError && '2rem'}` }}
                        disabled={!username || !roomName}
                    >Rejoindre</LoadingButton>

                </LoginContainer>
            );
    }
};

export default JoinRoom;
