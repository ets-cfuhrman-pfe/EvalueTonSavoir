const Users = require('../models/users');
const bcrypt = require('bcrypt');
const Quizzes = require('../models/quiz');
const Folders = require('../models/folders');
const { ObjectId } = require('mongodb');

jest.mock('bcrypt');
jest.mock('../middleware/AppError');
jest.mock('../models/folders');

describe('Users', () => {
    let users;
    let db;

    beforeEach(() => {
        jest.clearAllMocks(); // Clear any previous mock calls

        // Mock the database connection
        db = {
            connect: jest.fn(),
            getConnection: jest.fn().mockReturnThis(), // Add getConnection method
            collection: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }), // Mock insertOne to return an ObjectId
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
        };

        const quizModel = new Quizzes(db);
        const foldersModel = new Folders(db, quizModel);

        users = new Users(db, foldersModel);
    });

    it('should register a new user', async () => {
        db.collection().findOne.mockResolvedValue(null); // No user found
        db.collection().insertOne.mockResolvedValue({ insertedId: new ObjectId() });
        bcrypt.hash.mockResolvedValue('hashedPassword');
        users.folders.create.mockResolvedValue(true);

        const email = 'test@example.com';
        const password = 'password123';
        const result = await users.register(email, password);

        expect(db.connect).toHaveBeenCalled();
        expect(db.collection().findOne).toHaveBeenCalledWith({ email });
        expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        expect(db.collection().insertOne).toHaveBeenCalledWith({
            email,
            password: 'hashedPassword',
            created_at: expect.any(Date),
        });
        expect(users.folders.create).toHaveBeenCalledWith('Dossier par Défaut', expect.any(String));
        expect(result.insertedId).toBeDefined(); // Ensure result has insertedId
    });

    // it('should update the user password', async () => {
    //     db.collection().updateOne.mockResolvedValue({ modifiedCount: 1 });
    //     bcrypt.hash.mockResolvedValue('hashedPassword');

    //     const email = 'test@example.com';
    //     const newPassword = 'newPassword123';
    //     const result = await users.updatePassword(email, newPassword);

    //     expect(db.connect).toHaveBeenCalled();
    //     expect(db.collection().updateOne).toHaveBeenCalledWith(
    //         { email },
    //         { $set: { password: 'hashedPassword' } }
    //     );
    //     expect(result).toEqual(newPassword);
    // });

    // it('should delete a user', async () => {
    //     db.collection().deleteOne.mockResolvedValue({ deletedCount: 1 });

    //     const email = 'test@example.com';
    //     const result = await users.delete(email);

    //     expect(db.connect).toHaveBeenCalled();
    //     expect(db.collection().deleteOne).toHaveBeenCalledWith({ email });
    //     expect(result).toBe(true);
    // });

    // Add more tests as needed
});
