import React, { useEffect, useState } from 'react';

import { Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';

import StudentModeQuiz from 'src/components/StudentModeQuiz/StudentModeQuiz';
import TeacherModeQuiz from 'src/components/TeacherModeQuiz/TeacherModeQuiz';
import webSocketService, { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';

import '../../../styles/main.scss';
import { QuestionType } from '../../../Types/QuestionType';
import LoadingButton from '@mui/lab/LoadingButton';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

import LoginContainer from 'src/components/LoginContainer/LoginContainer';

import ApiService from '../../../services/ApiService';
import ValidationService from '../../../services/ValidationService';
import { useSearchParams } from 'react-router-dom';

export type AnswerType = Array<string | number | boolean>;

const JoinRoomV2: React.FC = () => {
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
    const [isRoomNameValid, setIsRoomNameValid] = useState(true);
    const [isUsernameValid, setIsUsernameValid] = useState(true);
    const [isManualRoomNameValid, setIsManualRoomNameValid] = useState(true);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const roomFromUrl = searchParams.get('roomName');
        if (roomFromUrl) {
            // Validate the room name from URL
            const validationResult = ValidationService.validateField('room.name', roomFromUrl, { required: true });
            if (validationResult.isValid) {
                setRoomName(roomFromUrl);
                setIsQRCodeJoin(true);
                setIsRoomNameValid(true);
                console.log('Mode QR Code détecté, salle:', roomFromUrl);
            } else {
                console.error('Nom de salle invalide dans l\'URL QR code:', roomFromUrl, 'Erreurs:', validationResult.errors);
                setConnectionError(`Nom de salle invalide: ${validationResult.errors[0]}`);
                setIsRoomNameValid(false);
            }
        }
    }, [searchParams]);

    // Validate initial username on mount
    useEffect(() => {
        if (username) {
            const validationResult = ValidationService.validateField('user.username', username, { required: true });
            setIsUsernameValid(validationResult.isValid);
        }
    }, []); // Only run once on mount

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

        socket.on('join-success', (roomJoinedName) => {
            setIsWaitingForTeacher(true);
            setIsConnecting(false);
            console.log(`on(join-success): Successfully joined the room ${roomJoinedName}`);
        });
        socket.on('next-question', (question: QuestionType) => {
            console.log('JoinRoomV2: on(next-question): Received next-question:', question);
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
                    setConnectionError("JoinRoomV2: timeout: Le serveur n'est pas disponible");
                    break;
                case 'websocket error':
                    setConnectionError("JoinRoomV2: websocket error: Le serveur n'est pas disponible");
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
            console.log(`Tentative de rejoindre : ${roomName}, utilisateur : ${username}`);

            webSocketService.joinRoom(roomName, username);
        }
    };

    const handleOnSubmitAnswer = (answer: AnswerType, idQuestion: number) => {
        console.info(`JoinRoomV2: handleOnSubmitAnswer: answer: ${answer}, idQuestion: ${idQuestion}`);
        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: idQuestion
        };
        setAnswers((prevAnswers) => {
            console.log(`JoinRoomV2: handleOnSubmitAnswer: prevAnswers: ${JSON.stringify(prevAnswers)}`);
            const newAnswers = [...prevAnswers]; // Create a copy of the previous answers array
            newAnswers[idQuestion - 1] = answerData; // Update the specific answer
            return newAnswers; // Return the new array
        });
        console.log(`JoinRoomV2: handleOnSubmitAnswer: answers: ${JSON.stringify(answers)}`);
        webSocketService.submitAnswer(answerData);
    };

    const handleReturnKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && 
            username && 
            isUsernameValid && 
            ((!isQRCodeJoin && roomName && isManualRoomNameValid) || 
             (isQRCodeJoin && roomName && isRoomNameValid))) {
            handleSocket();
        }
    };

    if (isWaitingForTeacher) {
        return (
            <div className='full-height' style={{ backgroundColor: 'var(--bs-light)' }}>
                <div className='card-header'>
                    <div className='flex-between'>
                        <div>
                            <DisconnectButton
                                onReturn={disconnect}
                                message={`Êtes-vous sûr de vouloir quitter?`} />    
                        </div>

                        <div className='flex-grow-1 text-center'>
                            <h1 className='title-lg'>Salle: {roomName}</h1>
                            <p className='subtitle'>
                                En attente que le professeur lance le questionnaire...
                            </p>
                        </div>

                        <div className='spacer-120'></div>
                    </div>
                </div>
            </div>
        );
    }

    switch (quizMode) {
        case 'student':
            return (
                <div className="d-flex flex-column full-height">
                    <StudentModeQuiz
                        questions={questions}
                        answers={answers}
                        submitAnswer={handleOnSubmitAnswer}
                        disconnectWebSocket={disconnect}
                    />
                </div>
            );
        case 'teacher':
            return (
                <div className="d-flex flex-column full-height">
                    {question && (
                        <TeacherModeQuiz
                            questionInfos={question}
                            answers={answers}
                            submitAnswer={handleOnSubmitAnswer}
                            disconnectWebSocket={disconnect}
                        />
                    )}
                </div>
            );
        default:
                return (
                <div className="center-content compact-height" style={{ backgroundColor: 'var(--bs-light)' }}>

                    <div className="login-container-wrapper">
                        <LoginContainer
                            title={isQRCodeJoin ? `Rejoindre la salle ${roomName} (V2)` : 'Rejoindre une salle (V2)'}
                            error={connectionError}
                        >
                            <div className="card-form">
                                {/* Afficher champ salle SEULEMENT si pas de QR code */}
                                {!isQRCodeJoin && (
                                    <div className="mb-3">
                                        <ValidatedTextField
                                            fieldPath="room.name"
                                            label="Nom de la salle"
                                            variant="outlined"
                                            initialValue={roomName}
                                            onValueChange={(value, isValid) => {
                                                setRoomName(value.toUpperCase());
                                                setIsManualRoomNameValid(isValid);
                                            }}
                                            placeholder="Nom de la salle"
                                            fullWidth={true}
                                            onKeyDown={handleReturnKey}
                                            required={true}
                                        />
                                    </div>
                                )}

                                {/* Champ username toujours visible */}
                                <div className="mb-3">
                                    <ValidatedTextField
                                        fieldPath="user.username"
                                        label="Nom d'utilisateur"
                                        variant="outlined"
                                        initialValue={username}
                                        onValueChange={(value, isValid) => {
                                            setUsername(value);
                                            setIsUsernameValid(isValid);
                                        }}
                                        placeholder="Nom d'utilisateur"
                                        fullWidth={true}
                                        onKeyDown={handleReturnKey}
                                        required={true}
                                    />
                                </div>

                                <LoadingButton
                                    loading={isConnecting}
                                    onClick={handleSocket}
                                    variant="contained"
                                    className="btn-primary"
                                    disabled={
                                        !username || 
                                        !isUsernameValid || 
                                        (!isQRCodeJoin && (!roomName || !isManualRoomNameValid)) || 
                                        (isQRCodeJoin && (!roomName || !isRoomNameValid))
                                    }
                                >
                                    {isQRCodeJoin ? 'Rejoindre avec QR Code (V2)' : 'Rejoindre (V2)'}
                                </LoadingButton>

                                {connectionError && (
                                    <div className="alert-error">
                                        {connectionError}
                                    </div>
                                )}
                            </div>
                        </LoginContainer>
                    </div>
                </div>
            );
    }
};

export default JoinRoomV2;