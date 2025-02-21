//StudentType.test.tsx
import { StudentType, Answer } from "../../Types/StudentType";

const user : StudentType = {
    name: 'Student',
    id: '123',
    answers: new Array<Answer>()
}

describe('StudentType', () => {
    test('creates a student with name, id and answers', () => {

        expect(user.name).toBe('Student');
        expect(user.id).toBe('123');
        expect(user.answers.length).toBe(0);
    });
});
