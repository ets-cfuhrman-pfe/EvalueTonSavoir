const Users = require('../../models/users');
const bcrypt = require('bcrypt');
const Quizzes = require('../../models/quiz');
const Folders = require('../../models/folders');
const { ObjectId } = require('mongodb');
const logger = require('../../config/logger');

jest.mock('bcrypt');
jest.mock('../../middleware/AppError');
jest.mock('../../models/folders');
jest.mock('../../config/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

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

    it.skip('should register a new user', async () => {
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



    // Logger coverage tests
    describe('Logger Coverage', () => {
        beforeEach(() => {
            // Clear logger mocks before each test
            jest.clearAllMocks();
        });

        it('should test complete login flow with successful authentication', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            // Setup mocks for successful login
            db.connect.mockResolvedValue();
            db.getConnection.mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue(mockUser)
                })
            });
            
            // Mock bcrypt.compare for password verification
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            users.verify = jest.fn().mockResolvedValue(true);

            const result = await users.login('test@example.com', 'password123');

            // Verify debug log for login attempt
            expect(logger.debug).toHaveBeenCalledWith(
                'User login attempt',
                expect.objectContaining({
                    email: 'test@example.com',
                    hasPassword: true
                })
            );

            // Verify info log for successful login
            expect(logger.info).toHaveBeenCalledWith(
                'User login successful',
                expect.objectContaining({
                    userId: 'user123',
                    email: 'test@example.com'
                })
            );

            expect(result).toEqual(mockUser);
        });

        it('should test login flow with user not found error', async () => {
            // Setup mocks for user not found
            db.connect.mockResolvedValue();
            db.getConnection.mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue(null)
                })
            });

            await expect(users.login('nonexistent@example.com', 'password123'))
                .rejects.toThrow('User not found');

            expect(logger.debug).toHaveBeenCalledWith(
                'User login attempt',
                expect.objectContaining({
                    email: 'nonexistent@example.com',
                    hasPassword: true
                })
            );

            expect(logger.error).toHaveBeenCalledWith(
                'User login failed',
                expect.objectContaining({
                    email: 'nonexistent@example.com',
                    error: 'User not found'
                })
            );
        });

        it('should test login flow with password mismatch error', async () => {
            const mockUser = {
                _id: 'user123',
                email: 'test@example.com',
                password: 'hashedPassword'
            };

            // Setup mocks for password mismatch
            db.connect.mockResolvedValue();
            db.getConnection.mockReturnValue({
                collection: jest.fn().mockReturnValue({
                    findOne: jest.fn().mockResolvedValue(mockUser)
                })
            });
            
            users.verify = jest.fn().mockResolvedValue(false);

            await expect(users.login('test@example.com', 'wrongpassword'))
                .rejects.toThrow('Password does not match');

            expect(logger.debug).toHaveBeenCalledWith(
                'User login attempt',
                expect.objectContaining({
                    email: 'test@example.com',
                    hasPassword: true
                })
            );

            expect(logger.error).toHaveBeenCalledWith(
                'User login failed',
                expect.objectContaining({
                    email: 'test@example.com',
                    error: 'Password does not match'
                })
            );
        });

        it('should test utility methods for coverage', async () => {
            // Test password hashing
            const hashedPassword = await users.hashPassword('test123');
            expect(hashedPassword).toBeDefined();
            
            // Test password generation
            const password = users.generatePassword();
            expect(password).toBeDefined();
            expect(typeof password).toBe('string');
            expect(password.length).toBeGreaterThan(0);
            
            // Test password verification
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            const isValid = await users.verify('test123', hashedPassword);
            expect(isValid).toBe(true);
        });
    });
});
