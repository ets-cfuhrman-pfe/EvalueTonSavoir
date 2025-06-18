import { AnswerType } from "src/pages/Student/JoinRoom/JoinRoom";

export interface Answer {
    answer: AnswerType;
    isCorrect: boolean;
    idQuestion: number;
}

export interface StudentType {
    name: string;
    id: string;
    room?: string;
    answers: Answer[];
    isActive?: boolean;
}
