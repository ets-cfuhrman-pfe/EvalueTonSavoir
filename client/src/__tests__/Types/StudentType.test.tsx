//Student.test.tsx
import { Student, Answer } from "../../Types/StudentType";

const user = new Student('Student', '123', 'TestRoom');

describe('Student', () => {
    test('creates a student with name, id, room, answers and isConnected', () => {
        expect(user.name).toBe('Student');
        expect(user.id).toBe('123');
        expect(user.room).toBe('TestRoom');
        expect(user.answers).toHaveLength(0);
        expect(user.isConnected).toBe(false);
    });

    test('creates student with custom answers', () => {
        const answer = new Answer(['test'], true, 1);
        const studentWithAnswers = new Student('Student2', '456', 'Room2', [answer]);
        
        expect(studentWithAnswers.answers).toHaveLength(1);
        expect(studentWithAnswers.answers[0].answer).toEqual(['test']);
        expect(studentWithAnswers.answers[0].isCorrect).toBe(true);
        expect(studentWithAnswers.answers[0].idQuestion).toBe(1);
    });

    test('creates student with custom isConnected', () => {
        const connectedStudent = new Student('Student3', '789', 'Room3', [], true);
        expect(connectedStudent.isConnected).toBe(true);
    });
});
