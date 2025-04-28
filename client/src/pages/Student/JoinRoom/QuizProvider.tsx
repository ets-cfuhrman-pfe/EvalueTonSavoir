import React, { useState } from 'react';
import { QuizContext } from './QuizContext';
import { QuestionType } from '../../../Types/QuestionType';
import { AnswerSubmissionToBackendType } from '../../../services/WebsocketService';
import { AnswerType } from './JoinRoom';
import webSocketService from '../../../services/WebsocketService';
import ApiService from '../../../services/ApiService'


export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    // State for showing answers
    const [showAnswer, setShowAnswer] = useState(false);

    // State for managing the list of questions
    const [questions, setQuestions] = useState<QuestionType[]>([]);

    // State for managing the list of answers
    const [answers, setAnswers] = useState<AnswerSubmissionToBackendType[]>([]);

    // Calculate the index based on the current question's ID
    const [index, setIndex] = useState<number | null>(null);
    
    const [isQuestionSent, setIsQuestionSent] = useState(false);

    const [isTeacherMode, setisTeacherMode] = useState(false);


    const [username, setUsername] = useState<string>(ApiService.getUsername());

    const [roomName, setRoomName] = useState<string>(''); // Add roomName state

    const [disconnectWebSocket, setDisconnectWebSocket] = useState<() => void>(() => () => {});


    const updateIndex = (questionId?: number | null) => {
        setIndex(questionId ?? null);

    };

    // Function to handle answer submission
    const submitAnswer = (answer: AnswerType) => {

        const answerData: AnswerSubmissionToBackendType = {
            roomName: roomName,
            answer: answer,
            username: username,
            idQuestion: Number(index),
        };
        setIsQuestionSent(true);
        // Update the answers state
        setAnswers((prevAnswers) => {
            const newAnswers = [...prevAnswers]; // Create a copy of the previous answers array
            newAnswers[Number(index)] = answerData; // Update the specific answer
            return newAnswers; // Return the new array
        });

        // Submit the answer to the WebSocket service
        webSocketService.submitAnswer(answerData);
        
    };

    return (
        <QuizContext.Provider
            value={{
                showAnswer,
                setShowAnswer,
                questions,
                setQuestions,
                answers,
                setAnswers,
                index, // Expose the index in the context
                updateIndex, // Expose a function to update the index
                submitAnswer, // Expose submitAnswer in the context
                isQuestionSent,
                setIsQuestionSent,
                isTeacherMode,
                setisTeacherMode,
                username,
                setUsername,
                roomName,
                setRoomName,
                disconnectWebSocket,
                setDisconnectWebSocket,
            }}
        >
            {children}
        </QuizContext.Provider>
    );
};