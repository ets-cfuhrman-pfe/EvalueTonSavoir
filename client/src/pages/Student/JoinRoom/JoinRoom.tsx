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

import { useQuizContext } from './QuizContext';


export type AnswerType = Array<string | number | boolean>;

const JoinRoom: React.FC = () => {
    const {
        setQuestions,
        setAnswers,
        questions,
        username,
        setUsername,
        setDisconnectWebSocket,
        roomName,
        setRoomName,
        index,
        updateIndex,

    } = useQuizContext();

    const [socket, setSocket] = useState<Socket | null>(null);
    const [isWaitingForTeacher, setIsWaitingForTeacher] = useState(false);
    const [quizMode, setQuizMode] = useState<string>();
    const [connectionError, setConnectionError] = useState<string>('');
    const [isConnecting, setIsConnecting] = useState<boolean>(false);


    useEffect(() => {
        // Set the disconnectWebSocket function in the context
        setDisconnectWebSocket(() => disconnect);
    }, [socket]);

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
        console.log(`JoinRoom: handleCreateSocket: ${ENV_VARIABLES.VITE_BACKEND_URL}`);
        const socket = webSocketService.connect(ENV_VARIABLES.VITE_BACKEND_URL);

        socket.on('join-success', (roomJoinedName) => {
            setIsWaitingForTeacher(true);
            setIsConnecting(false);
            console.log(`on(join-success): Successfully joined the room ${roomJoinedName}`);
        });
        socket.on('next-question', (question: QuestionType) => {
            console.log('JoinRoom: on(next-question): Received next-question:', question);
            setQuizMode('teacher');
            setIsWaitingForTeacher(false);   
            updateIndex(Number(question.question.id) -1);
            
        });
        socket.on('launch-teacher-mode', (questions: QuestionType[]) => {
            console.log('on(launch-teacher-mode): Received launch-teacher-mode:', questions);
            setQuizMode('teacher');
            setIsWaitingForTeacher(true);
            updateIndex(0);
            console.log('on(launch-teacher-mode): setQuestions:', index);
            setQuestions(questions);
            // wait for next-question
        });
        socket.on('launch-student-mode', (questions: QuestionType[]) => {
            console.log('on(launch-student-mode): Received launch-student-mode:', questions);

            setQuizMode('student');
            setIsWaitingForTeacher(false);
            setQuestions([]);  // clear out from last time (in case quiz is repeated)
            setQuestions(questions);
            updateIndex(0);
            console.log('on(launch-student-mode): setQuestions:', index);
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
        //        localStorage.clear();
        webSocketService.disconnect();
        setSocket(null);
        updateIndex(null);
        setIsWaitingForTeacher(false);
        setQuizMode('');
        setRoomName('');
        setUsername('');
        setIsConnecting(false);
        setAnswers([]);
    };

    const handleSocket = () => {
        setIsConnecting(true);
        setConnectionError('');
        if (!socket?.connected) {
            handleCreateSocket();
        }

        if (username && roomName) {
            console.log(`Tentative de rejoindre : ${roomName}, utilisateur : ${username}`);

            webSocketService.joinRoom(roomName, username);
        }
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
                <StudentModeQuiz />
            );
        case 'teacher':
            return (
                index != null && (
                    <TeacherModeQuiz/>
                )
            );
        default:
            return (
                <LoginContainer
                    title='Rejoindre une salle'
                    error={connectionError}>

                    <TextField
                        type="text"
                        label="Nom de la salle"
                        variant="outlined"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                        placeholder="Nom de la salle"
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
