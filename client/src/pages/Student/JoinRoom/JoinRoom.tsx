import React, { useEffect, useState } from 'react';

import { Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';

import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import webSocketService, { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';

import './joinRoom.css';
import { QuestionType } from '../../../Types/QuestionType';
import LoadingButton from '@mui/lab/LoadingButton';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

import LoginContainer from 'src/components/LoginContainer/LoginContainer';

import ApiService from '../../../services/ApiService';
import { useSearchParams } from 'react-router-dom';

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
    const [isQRCodeJoin, setIsQRCodeJoin] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const roomFromUrl = searchParams.get('roomName');
        if (roomFromUrl) {
            setRoomName(roomFromUrl);
            setIsQRCodeJoin(true);
            console.log('Mode QR Code détecté, salle:', roomFromUrl);
        }
    }, [searchParams]);

    useEffect(() => {
        handleCreateSocket();
        return () => {
            disconnect();
        };
    }, []);

    useEffect(() => {
        console.log(`JoinRoom: useEffect: questions: ${JSON.stringify(questions)}`);
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
            setQuestion(question);
        });
        socket.on('launch-teacher-mode', (questions: QuestionType[]) => {
            console.log('on(launch-teacher-mode): Received launch-teacher-mode:', questions);
            setQuizMode('teacher');
            setIsWaitingForTeacher(true);
            setQuestions([]);  // clear out from last time (in case quiz is repeated)
            setQuestions(questions);
            // wait for next-question
        });
        socket.on('launch-student-mode', (questions: QuestionType[]) => {
            console.log('on(launch-student-mode): Received launch-student-mode:', questions);

            setQuizMode('student');
            setIsWaitingForTeacher(false);
            setQuestions([]);  // clear out from last time (in case quiz is repeated)
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
        //        localStorage.clear();
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
            console.log(`Tentative de rejoindre : ${roomName}, utilisateur : ${username}`);

            webSocketService.joinRoom(roomName, username);
        }
    };

    const handleOnSubmitAnswer = (answer: AnswerType, idQuestion: number) => {
        console.info(`JoinRoom: handleOnSubmitAnswer: answer: ${answer}, idQuestion: ${idQuestion}`);
        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: idQuestion
        };
        // localStorage.setItem(`Answer${idQuestion}`, JSON.stringify(answer));
        setAnswers((prevAnswers) => {
            console.log(`JoinRoom: handleOnSubmitAnswer: prevAnswers: ${JSON.stringify(prevAnswers)}`);
            const newAnswers = [...prevAnswers]; // Create a copy of the previous answers array
            newAnswers[idQuestion - 1] = answerData; // Update the specific answer
            return newAnswers; // Return the new array
        });
        console.log(`JoinRoom: handleOnSubmitAnswer: answers: ${JSON.stringify(answers)}`);
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
                <LoginContainer
                    title={isQRCodeJoin ? `Rejoindre la salle ${roomName}` : 'Rejoindre une salle'}
                    error={connectionError}
                >
                    {/* Afficher champ salle SEULEMENT si pas de QR code */}
                    {!isQRCodeJoin && (
                        <ValidatedTextField
                            fieldPath="room.name"
                            label="Nom de la salle"
                            variant="outlined"
                            initialValue={roomName}
                            onValueChange={(value) => setRoomName(value.toUpperCase())}
                            placeholder="Nom de la salle"
                            sx={{ marginBottom: '1rem' }}
                            fullWidth={true}
                            onKeyDown={handleReturnKey}
                            required={true}
                        />
                    )}

                    {/* Champ username toujours visible */}
                    <ValidatedTextField
                        fieldPath="user.username"
                        label="Nom d'utilisateur"
                        variant="outlined"
                        initialValue={username}
                        onValueChange={(value) => setUsername(value)}
                        placeholder="Nom d'utilisateur"
                        sx={{ marginBottom: '1rem' }}
                        fullWidth={true}
                        onKeyDown={handleReturnKey}
                        required={true}
                    />

                    <LoadingButton
                        loading={isConnecting}
                        onClick={handleSocket}
                        variant="contained"
                        sx={{ marginBottom: `${connectionError && '2rem'}` }}
                        disabled={!username || (!isQRCodeJoin && !roomName) || (isQRCodeJoin && !roomName)}
                    >
                        {isQRCodeJoin ? 'Rejoindre avec QR Code' : 'Rejoindre'}
                    </LoadingButton>
                </LoginContainer>
            );
    }
};

export default JoinRoom;
