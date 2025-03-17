const { ObjectId } = require('mongodb');
const Admin = require('../models/admin'); // Adjust the path if needed

// Mock database connection
const mockDb = {
    connect: jest.fn(),
    getConnection: jest.fn()
};

const mockCollectionUsers = {
    find: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
    deleteOne: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis()
};

const mockCollectionFiles = { ...mockCollectionUsers };
const mockCollectionImages = { ...mockCollectionUsers };

mockDb.getConnection.mockReturnValue({
    collection: jest.fn((name) => {
        if (name === 'users') return mockCollectionUsers;
        if (name === 'files') return mockCollectionFiles;
        if (name === 'images') return mockCollectionImages;
    })
});

describe('Admin class', () => {
    let admin;

    beforeEach(() => {
        jest.clearAllMocks();
        admin = new Admin(mockDb);
    });

    test('getUsers should return users', async () => {
        const mockUsers = [{ _id: new ObjectId(), email: 'test@example.com' }];
        mockCollectionUsers.toArray.mockResolvedValue(mockUsers);

        const users = await admin.getUsers();
        expect(users).toEqual(mockUsers);
    });

    test('deleteUser should return true when user is deleted', async () => {
        mockCollectionUsers.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await admin.deleteUser(new ObjectId().toHexString());
        expect(result).toBe(true);
    });

    test('deleteUser should return false if no user was deleted', async () => {
        mockCollectionUsers.deleteOne.mockResolvedValue({ deletedCount: 0 });

        const result = await admin.deleteUser(new ObjectId().toHexString());
        expect(result).toBe(false);
    });

    test('getStats should return correct stats', async () => {
        mockCollectionUsers.countDocuments.mockResolvedValue(10);
        mockCollectionFiles.toArray.mockResolvedValue([{ _id: new ObjectId(), email: 'user@example.com', title: 'Test Quiz' }]);

        const stats = await admin.getStats();
        expect(stats).toEqual({ quizzes: [{ _id: expect.any(ObjectId), email: 'user@example.com', title: 'Test Quiz' }], total: 10 });
    });

    test('getImages should return paginated images', async () => {
        mockCollectionImages.countDocuments.mockResolvedValue(5);
        mockCollectionImages.toArray.mockResolvedValue([
            { _id: new ObjectId(), userId: 'user1', file_name: 'image.png', file_content: Buffer.from('data'), mime_type: 'image/png' }
        ]);

        const images = await admin.getImages(1, 10);
        expect(images).toEqual({
            images: [{
                id: expect.any(ObjectId),
                user: 'user1',
                file_name: 'image.png',
                file_content: expect.any(String),
                mime_type: 'image/png'
            }],
            total: 5
        });
    });

    test('deleteImage should return true when an image is deleted', async () => {
        mockCollectionFiles.toArray.mockResolvedValue([]);
        mockCollectionImages.deleteOne.mockResolvedValue({ deletedCount: 1 });

        const result = await admin.deleteImage(new ObjectId().toHexString());
        expect(result).toEqual({ deleted: true });
    });

    test('deleteImage should return false when an image is not deleted', async () => {
        mockCollectionFiles.toArray.mockResolvedValue([{ _id: new ObjectId(), email: 'user@example.com', title: 'Test Quiz' }]);
        mockCollectionImages.deleteOne.mockResolvedValue({ deletedCount: 0 });

        const result = await admin.deleteImage(new ObjectId().toHexString());
        expect(result).toEqual({ deleted: false });
    });
});
