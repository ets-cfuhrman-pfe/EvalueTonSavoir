import { AnswerType } from "src/pages/Student/JoinRoom/JoinRoomV2";

export class Answer {
    answer: AnswerType;
    isCorrect: boolean;
    idQuestion: number;

    constructor(answer: AnswerType, isCorrect: boolean, idQuestion: number) {
        this.answer = answer;
        this.isCorrect = isCorrect;
        this.idQuestion = idQuestion;
    }
}

export class Student {
    name: string;
    id: string;
    room: string;
    answers: Answer[];
    isConnected: boolean;

    constructor(
        name: string, 
        id: string, 
        room: string,
        answers: Answer[] = [],
        isConnected: boolean = false
    ) {
        this.name = name;
        this.id = id;
        this.room = room;
        this.answers = answers;
        this.isConnected = isConnected;
    }
}
