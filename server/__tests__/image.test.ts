import { Image } from '../models/image';
import { User } from '../models/user';

describe('Image', () => {
    let mockUser: User;

    beforeEach(() => {
        mockUser = new User({
            email: 'test@example.com',
            hashedPassword: 'hashedPassword123'
        });
    });

    it('should create an image with the correct properties', () => {
        const fileName = 'test.png';
        const fileContent = Buffer.from('test content');
        const mimeType = 'image/png';
        const image = new Image(fileName, fileContent, mimeType, mockUser);

        expect(image.file_name).toBe(fileName);
        expect(image.file_content).toBe(fileContent);
        expect(image.mime_type).toBe(mimeType);
        expect(image.owner).toBe(mockUser);
    });
});
