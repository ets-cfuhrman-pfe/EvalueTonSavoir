import React, { Dispatch, SetStateAction, useContext } from 'react';


export const QuizContext = React.createContext<{
    showAnswer: boolean;
    setShowAnswer: Dispatch<SetStateAction<boolean>>;
  }>({
    showAnswer: false,
    setShowAnswer: () => {},
  });
  
export const useQuizContext = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuizContext must be used within a QuizProvider');
  }
  return context;
};
