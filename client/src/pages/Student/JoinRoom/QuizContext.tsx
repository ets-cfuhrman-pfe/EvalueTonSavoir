import React, { Dispatch, SetStateAction, useContext } from 'react';
import { QuestionType } from '../../../Types/QuestionType';
import { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import { AnswerType } from './JoinRoom';

export const QuizContext = React.createContext<{
    showAnswer: boolean;
    setShowAnswer: Dispatch<SetStateAction<boolean>>;
    questions: QuestionType[];
    setQuestions: Dispatch<SetStateAction<QuestionType[]>>;
    answers: AnswerSubmissionToBackendType[];
    setAnswers: Dispatch<SetStateAction<AnswerSubmissionToBackendType[]>>;
    answer : AnswerType;
    setAnswer: Dispatch<SetStateAction<AnswerType>>;
    index: number | null; // Add index to the context
    updateIndex: (questionId: number | null) => void; // Add a function to update the index
    submitAnswer: (answer: AnswerType, idQuestion?: number) => void; // Updated submitAnswer signature
    isQuestionSent: boolean;
    setIsQuestionSent: Dispatch<SetStateAction<boolean>>;
    roomName: string;
    setRoomName: Dispatch<SetStateAction<string>>; 
    username: string; // Username of the user
    setUsername: Dispatch<SetStateAction<string>>; // Setter for username
    disconnectWebSocket: () => void; // Function to disconnect the WebSocket
    setDisconnectWebSocket: Dispatch<SetStateAction<() => void>>; // Setter for disconnectWebSocket
    
}>({
    showAnswer: false,
    setShowAnswer: () => {},
    questions: [],
    setQuestions: () => {},
    answers: [],
    setAnswers: () => {},
    answer: [], // Default value for answer
    setAnswer: () => {}, // Default no-op function
    index: null, // Default value for index
    updateIndex: () => {}, // Default no-op function
    submitAnswer: () => {}, // Default no-op function
    isQuestionSent: false,
    setIsQuestionSent: () => {},
    username: '', // Default value for username
    setUsername: () => {}, // Default no-op function
    roomName: '', // Default value for roomName
    setRoomName: () => {}, // Default no-op function
    disconnectWebSocket: () => {}, // Default no-op function
    setDisconnectWebSocket: () => {}, // Default no-op function
});

export const useQuizContext = () => {
    const context = useContext(QuizContext);
    if (!context) {
        throw new Error('useQuizContext must be used within a QuizProvider');
    }
    return context;
};