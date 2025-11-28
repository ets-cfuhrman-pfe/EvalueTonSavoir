import React, { useEffect, useState } from 'react';

import { Socket } from 'socket.io-client';
import { ENV_VARIABLES } from 'src/constants';
import { useBeforeUnload, useSearchParams, useNavigate } from 'react-router-dom';

import StudentModeQuizV2 from 'src/components/StudentModeQuiz/StudentModeQuizV2';
import TeacherModeQuizV2 from 'src/components/TeacherModeQuiz/TeacherModeQuizV2';
import webSocketService, { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import DisconnectButton from 'src/components/DisconnectButton/DisconnectButton';

import '../../../styles/main.scss';
import { QuestionType } from '../../../Types/QuestionType';
import LoadingButton from '@mui/lab/LoadingButton';
import ValidatedTextField from '../../../components/ValidatedTextField/ValidatedTextField';

import LoginContainerV2 from 'src/components/LoginContainer/LoginContainerV2';

import ApiService from '../../../services/ApiService';
import ValidationService from '../../../services/ValidationService';
import { setCurrentRoomName, clearCurrentRoomName } from '../../../utils/roomUtils';

export type AnswerType = Array<string | number | boolean>;

const JoinRoomV2: React.FC = () => {
    const navigate = useNavigate();
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
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizTitle, setQuizTitle] = useState<string>('Quiz');

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
    }, []);

    useEffect(() => {
        handleCreateSocket();
        return () => {
            webSocketService.disconnect();
        };
    }, []);

    // Hide header when component mounts, show when unmounts
    useEffect(() => {
        // Find and hide potential header elements
        const possibleHeaders = document.querySelectorAll('header, .header, .app-header, .main-header, .navbar, nav, .top-header, .site-header');
        
        possibleHeaders.forEach((header) => {
            (header as HTMLElement).style.display = 'none';
        });
        
        document.body.classList.add('hide-header');
        
        return () => {
            // Restore headers when leaving
            possibleHeaders.forEach((header) => {
                (header as HTMLElement).style.display = '';
            });
            document.body.classList.remove('hide-header');
        };
    }, []);

    // Prevent accidental browser refresh/close during active quiz
    useBeforeUnload(
        React.useCallback((event) => {
            if (isWaitingForTeacher || quizMode) {
                event.preventDefault();
                event.returnValue = "Êtes-vous sûr de vouloir quitter? Votre progression sera perdue.";
            }
        }, [isWaitingForTeacher, quizMode])
    );

    // Block browser back button during active quiz
    useEffect(() => {
        const handlePopState = (_event: PopStateEvent) => {
            if (isWaitingForTeacher || quizMode) {
                const shouldLeave = window.confirm(
                    "Êtes-vous sûr de vouloir quitter? Votre progression dans le questionnaire sera perdue."
                );
                if (!shouldLeave) {
                    // Push the state back to prevent navigation
                    window.history.pushState(null, '', window.location.href);
                } else {
                    disconnect();
                }
            }
        };

        // Add initial state to enable popstate detection
        if (isWaitingForTeacher || quizMode) {
            window.history.pushState(null, '', window.location.href);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isWaitingForTeacher, quizMode]);

    // Clear room name when component unmounts
    useEffect(() => {
        return () => {
            clearCurrentRoomName();
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
            // Set the room name in global storage for header display
            setCurrentRoomName(roomJoinedName);
        });
        socket.on('next-question', (question: QuestionType) => {
            // console.log('JoinRoomV2: on(next-question): Received next-question:', question);
            setQuizMode('teacher');
            setIsWaitingForTeacher(false);
            setQuestion(question);
        });
        socket.on('launch-teacher-mode', ({ questions, quizTitle }: { questions: QuestionType[], quizTitle: string }) => {
            // console.log('on(launch-teacher-mode): Received launch-teacher-mode:', questions);
            setQuizMode('teacher');
            setIsWaitingForTeacher(true);
            setQuestions([]);  
            setQuestions(questions);
            setQuizTitle(quizTitle);
        });
        socket.on('launch-student-mode', ({ questions, quizTitle }: { questions: QuestionType[], quizTitle: string }) => {
            // console.log('on(launch-student-mode): Received launch-student-mode:', questions);

            setQuizMode('student');
            setIsWaitingForTeacher(false);
            setQuestions([]);  // clear out from last time (in case quiz is repeated)
            setQuestions(questions);
            setQuestion(questions[0]);
            setQuizTitle(quizTitle);
        });
        socket.on('end-quiz', () => {
            setQuizCompleted(true);
            disconnect();
        });
        socket.on('join-failure', (message) => {
            console.log('Failed to join the room.');
            console.log('Join failure message:', message);

            // Check if this is a QR code join by looking at URL parameter directly
            const roomFromUrl = searchParams.get('roomName');
            const isQRCodeMode = !!roomFromUrl;
            
            // console.log('roomFromUrl:', roomFromUrl);
            // console.log('isQRCodeMode:', isQRCodeMode);

            // If room doesn't exist and it's QR code mode, show waiting page instead of error
            if (message === "Le nom de la salle n'existe pas" && isQRCodeMode) {
                // console.log('Showing waiting page for QR code join');
                setIsWaitingForTeacher(true);
                setIsConnecting(false);
                // Set the room name in global storage for header display
                setCurrentRoomName(roomFromUrl);
            } else {
                console.log('Showing error message');
                setConnectionError(`Erreur de connexion : ${message}`);
                setIsConnecting(false);
            }
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

        socket.on('disconnect', (reason) => {
            console.log('JoinRoomV2: Disconnected:', reason);
            if (reason === "io server disconnect") {
                disconnect();
                setConnectionError("Le professeur a fermé la salle.");
            }
        });

        setSocket(socket);
    };

    const disconnect = () => {
        webSocketService.disconnect();
        setSocket(null);
        setQuestion(undefined);
        setIsWaitingForTeacher(false);
        setQuizMode('');
        setQuestions([]);
        setAnswers([]);
        setQuizCompleted(false);
        clearCurrentRoomName();
        // Reset to initial login state
        setUsername(ApiService.getUsername());
        setConnectionError('');
        setIsConnecting(false);

        setRoomName('');
        setIsQRCodeJoin(false);
        navigate('/student/join-room-v2', { replace: true });
    };

    const handleSocket = () => {
        setIsConnecting(true);
        setConnectionError('');
        if (!socket?.connected) {
            handleCreateSocket();
        }

        if (username && roomName) {
            // console.log(`Tentative de rejoindre : ${roomName}, utilisateur : ${username}`);

            webSocketService.joinRoom(roomName, username);
        }
    };

    const handleOnSubmitAnswer = (answer: AnswerType, idQuestion: number) => {
        // console.info(`JoinRoomV2: handleOnSubmitAnswer: answer: ${answer}, idQuestion: ${idQuestion}`);
        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: idQuestion
        };
        setAnswers((prevAnswers) => {
            // console.log(`JoinRoomV2: handleOnSubmitAnswer: prevAnswers: ${JSON.stringify(prevAnswers)}`);
            const newAnswers = [...prevAnswers]; // Create a copy of the previous answers array
            newAnswers[idQuestion - 1] = answerData; // Update the specific answer
            return newAnswers; // Return the new array
        });
        // console.log(`JoinRoomV2: handleOnSubmitAnswer: answers: ${JSON.stringify(answers)}`);
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
                                askConfirm={true}
                                message={`Êtes-vous sûr de vouloir quitter la salle ${roomName}?`} />
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

    // Check if student has completed all questions
    const hasCompletedAllQuestions = questions.length > 0 &&
        answers.length === questions.length &&
        answers.every(answer => answer?.answer !== undefined && answer?.roomName !== undefined);

    switch (quizMode) {
        case 'student':
            return (
                <div className="d-flex flex-column full-height">
                    <StudentModeQuizV2
                        questions={questions}
                        answers={answers}
                        submitAnswer={handleOnSubmitAnswer}
                        disconnectWebSocket={disconnect}
                        studentName={username}
                        quizCompleted={quizCompleted || hasCompletedAllQuestions}
                        quizTitle={quizTitle}
                    />
                </div>
            );
        case 'teacher': {
            return (
                <div className="d-flex flex-column full-height">
                    {question ? (
                        <TeacherModeQuizV2
                            questionInfos={question}
                            answers={answers}
                            submitAnswer={handleOnSubmitAnswer}
                            disconnectWebSocket={disconnect}
                            quizCompleted={quizCompleted || hasCompletedAllQuestions}
                            questions={questions}
                            studentName={username}
                            quizTitle={quizTitle}
                            totalQuestions={questions.length}
                        />
                    ) : (<div>Chargement de la question...</div>
                    )}
                </div>
            );
        }
        default:
            return (
                <div className="center-content compact-height" style={{ backgroundColor: 'var(--bs-light)' }}>
                    <div className="w-100" style={{ maxWidth: '400px' }}>
                        <LoginContainerV2
                            title={isQRCodeJoin ? `Rejoindre la salle ${roomName}` : 'Rejoindre une salle'}
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
                                    {isQRCodeJoin ? 'Rejoindre avec QR Code' : 'Rejoindre'}
                                </LoadingButton>

                                {connectionError && (
                                    <div className="alert-error">
                                        {connectionError}
                                    </div>
                                )}
                            </div>
                        </LoginContainerV2>
                    </div>
                </div>
            );
    }
};

export default JoinRoomV2;