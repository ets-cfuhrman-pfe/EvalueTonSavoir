import React, { useEffect, useState } from 'react';
import { QuizContext } from './QuizContext';

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // State for showing answers
    const [showAnswer, setShowAnswer] = useState(false);

    console.log('QuizProvider: showAnswer:', showAnswer);

    useEffect(() => {
        console.log('QuizProvider: showAnswer:', showAnswer);
    }, [showAnswer]);

    return (
        <QuizContext.Provider value={{ showAnswer, setShowAnswer }}>
            {children}
        </QuizContext.Provider>
    );
};
