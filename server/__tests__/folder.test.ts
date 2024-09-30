import { Folder } from '../models/folder';
import { User } from '../models/user';

describe('Folder', () => {
    let mockUser: User;

    beforeEach(() => {
        mockUser = new User({
            email: 'test@example.com',
            hashedPassword: 'hashedPassword123'
        });
    });

    it('should create a folder with the correct title and user', () => {
        const title = 'Test Folder';
        const folder = new Folder(title, mockUser);

        expect(folder.title).toBe(title);
        expect(folder.user).toBe(mockUser);
        expect(folder.created_at).toBeInstanceOf(Date);
    });
});
