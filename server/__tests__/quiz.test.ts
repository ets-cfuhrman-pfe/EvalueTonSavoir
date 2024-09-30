import { Quiz } from '../models/quiz';
import { ObjectId } from 'mongodb';
import { Folder } from '../models/folder';
import { User, UserOptions } from '../models/user';

describe('Quiz Class', () => {

    it('should create a new quiz', async () => {
        // mock a folder and a user object
        const userOptions: UserOptions = {
            email: 'email',
            hashedPassword: 'hashedPassword'
        };
        const user = new User(userOptions);
        const folder = new Folder('folderId', user);

        const quiz = new Quiz(folder, user, 'title', 'content');

        expect(quiz.user).toEqual(user);
        expect(quiz.folder).toEqual(folder);
    });

});
