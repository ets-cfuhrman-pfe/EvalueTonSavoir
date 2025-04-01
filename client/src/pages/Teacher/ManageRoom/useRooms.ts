import { useContext } from 'react';
import { RoomType } from 'src/Types/RoomType';
import { createContext } from 'react';
import { MultipleNumericalAnswer, NumericalAnswer, ParsedGIFTQuestion } from 'gift-pegjs';
import { QuestionType } from 'src/Types/QuestionType';
import { AnswerType } from 'src/pages/Student/JoinRoom/JoinRoom';
import {
  isSimpleNumericalAnswer,
  isRangeNumericalAnswer,
  isHighLowNumericalAnswer,
  isMultipleNumericalAnswer
} from 'gift-pegjs/typeGuards';

type RoomContextType = {
    rooms: RoomType[];
    selectedRoom: RoomType | null;
    selectRoom: (roomId: string) => void;
    createRoom: (title: string) => Promise<void>;
  };
  
export const RoomContext = createContext<RoomContextType | undefined>(undefined);
  
export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRooms must be used within a RoomProvider');
  return context;
};

/**
 * Checks if the answer is correct - logic varies by type of question!
 * True/False: answer must match the isTrue property
 * Multiple Choice: answer must match the correct choice(s)
 * Numerical: answer must be within the range or equal to the number (for each type of correct answer)
 * Short Answer: answer must match the correct choice(s) (case-insensitive)
 * @param answer 
 * @param idQuestion 
 * @param questions 
 * @returns 
 */
export function checkIfIsCorrect(
  answer: AnswerType,
  idQuestion: number,
  questions: QuestionType[]
): boolean {
  const questionInfo = questions.find((q) =>
    q.question.id ? q.question.id === idQuestion.toString() : false
  ) as QuestionType | undefined;

  const simpleAnswerText = answer.toString();
  if (questionInfo) {
    const question = questionInfo.question as ParsedGIFTQuestion;
    if (question.type === 'TF') {
      return (
        (question.isTrue && simpleAnswerText == 'true') ||
        (!question.isTrue && simpleAnswerText == 'false')
      );
    } else if (question.type === 'MC') {
      const correctChoices = question.choices.filter((choice) => choice.isCorrect
        /* || (choice.weight && choice.weight > 0)*/  // handle weighted answers
      );
      const multipleAnswers = Array.isArray(answer) ? answer : [answer as string];
      if (correctChoices.length === 0) {
        return false;
      }
      // check if all (and only) correct choices are in the multipleAnswers array
      return correctChoices.length === multipleAnswers.length && correctChoices.every(
        (choice) => multipleAnswers.includes(choice.formattedText.text)
      );
    } else if (question.type === 'Numerical') {
      if (isMultipleNumericalAnswer(question.choices[0])) { // Multiple numerical answers
        // check to see if answer[0] is a match for any of the choices that isCorrect
        const correctChoices = question.choices.filter((choice) => isMultipleNumericalAnswer(choice) && choice.isCorrect);
        if (correctChoices.length === 0) { // weird case where there are multiple numerical answers but none are correct
          return false;
        }
        return correctChoices.some((choice) => {
          // narrow choice to MultipleNumericalAnswer type
          const multipleNumericalChoice = choice as MultipleNumericalAnswer;
          return isCorrectNumericalAnswer(multipleNumericalChoice.answer, simpleAnswerText);
        });
      }
      if (isHighLowNumericalAnswer(question.choices[0])) {
        // const choice = question.choices[0];
        // const answerNumber = parseFloat(simpleAnswerText);
        // if (!isNaN(answerNumber)) {
        //   return (
        //     answerNumber <= choice.numberHigh && answerNumber >= choice.numberLow
        //   );
        // }
        return isCorrectNumericalAnswer(question.choices[0], simpleAnswerText);
      }
      if (isRangeNumericalAnswer(question.choices[0])) {
        // const answerNumber = parseFloat(simpleAnswerText);
        // const range = question.choices[0].range;
        // const correctAnswer = question.choices[0].number;
        // if (!isNaN(answerNumber)) {
        //   return (
        //     answerNumber <= correctAnswer + range &&
        //     answerNumber >= correctAnswer - range
        //   );
        // }
        return isCorrectNumericalAnswer(question.choices[0], simpleAnswerText);
      }
      if (isSimpleNumericalAnswer(question.choices[0])) {
        // const answerNumber = parseFloat(simpleAnswerText);
        // if (!isNaN(answerNumber)) {
        //   return answerNumber === question.choices[0].number;
        // }
        return isCorrectNumericalAnswer(question.choices[0], simpleAnswerText);
      }
    } else if (question.type === 'Short') {
      return question.choices.some(
        (choice) => choice.text.toUpperCase() === simpleAnswerText.toUpperCase()
      );
    }
  }
  return false;
}

/**
* Determines if a numerical answer is correct based on the type of numerical answer.
* @param correctAnswer The correct answer (of type NumericalAnswer).
* @param userAnswer The user's answer (as a string or number).
* @returns True if the user's answer is correct, false otherwise.
*/
export function isCorrectNumericalAnswer(
  correctAnswer: NumericalAnswer,
  userAnswer: string | number
): boolean {
  const answerNumber = typeof userAnswer === 'string' ? parseFloat(userAnswer) : userAnswer;

  if (isNaN(answerNumber)) {
      return false; // User's answer is not a valid number
  }

  if (isSimpleNumericalAnswer(correctAnswer)) {
      // Exact match for simple numerical answers
      return answerNumber === correctAnswer.number;
  }

  if (isRangeNumericalAnswer(correctAnswer)) {
      // Check if the user's answer is within the range
      const { number, range } = correctAnswer;
      return answerNumber >= number - range && answerNumber <= number + range;
  }

  if (isHighLowNumericalAnswer(correctAnswer)) {
      // Check if the user's answer is within the high-low range
      const { numberLow, numberHigh } = correctAnswer;
      return answerNumber >= numberLow && answerNumber <= numberHigh;
  }

  // if (isMultipleNumericalAnswer(correctAnswer)) {
  //     // Check if the user's answer matches any of the multiple numerical answers
  //     return correctAnswer.answer.some((choice) =>
  //         isCorrectNumericalAnswer(choice, answerNumber)
  //     );
  // }

  return false; // Default to false if the answer type is not recognized
}
