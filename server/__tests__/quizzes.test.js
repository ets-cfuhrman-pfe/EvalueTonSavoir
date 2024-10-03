const { ObjectId } = require('mongodb');
const Quizzes = require('../models/quiz'); // Adjust the path as necessary

describe('Quizzes', () => {
    let db;
    let quizzes;
    let collection;

    beforeEach(() => {
        jest.clearAllMocks(); // Clear any previous mock calls

        // Mock the collection object
        collection = {
            findOne: jest.fn(),
            insertOne: jest.fn(),
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }), // Mock the find method
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
            updateOne: jest.fn(),
            getContent: jest.fn(),
        };

        // Mock the database connection
        db = {
            connect: jest.fn(),
            getConnection: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue(collection),
            }),
        };

        // Initialize the Quiz model with the mocked db
        quizzes = new Quizzes(db);
    });

    describe('create', () => {
        it('should create a new quiz if it does not exist', async () => {
            const title = 'Test Quiz';
            const content = 'This is a test quiz.';
            const folderId = '507f1f77bcf86cd799439011';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue(null);
            collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const result = await quizzes.create(title, content, folderId, userId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ title, folderId, userId });
            expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({
                folderId,
                userId,
                title,
                content,
                created_at: expect.any(Date),
                updated_at: expect.any(Date),
            }));
            expect(result).not.toBeNull();
        });

        it('should return null if the quiz already exists', async () => {
            const title = 'Existing Quiz';
            const content = 'This is an existing quiz.';
            const folderId = '507f1f77bcf86cd799439011';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ title, folderId, userId });

            const result = await quizzes.create(title, content, folderId, userId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ title, folderId, userId });
            expect(collection.insertOne).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });

    describe('getOwner', () => {
        it('should return the owner of the quiz', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ userId });

            const result = await quizzes.getOwner(quizId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(quizId) });
            expect(result).toBe(userId);
        });
    });

    describe('getContent', () => {
        it('should return the content of the quiz', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const content = 'This is a test quiz.';

            // Mock the database response
            collection.findOne.mockResolvedValue({ content });

            const result = await quizzes.getContent(quizId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(quizId) });
            expect(result).toEqual({ content });
        });
    });

    describe('delete', () => {
        it('should delete the quiz', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteOne.mockResolvedValue({deletedCount: 1});

            await quizzes.delete(quizId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(quizId) });
        });
    
        it('should return false if the quiz does not exist', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
    
            // Mock the database response
            collection.deleteOne.mockResolvedValue({deletedCount: 0});
    
            const result = await quizzes.delete(quizId);
    
            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(quizId) });
            expect(result).toBe(false);
        });
    });

    // deleteQuizzesByFolderId
    describe('deleteQuizzesByFolderId', () => {
        it('should delete all quizzes in a folder', async () => {
            const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteMany.mockResolvedValue({deletedCount: 2});

            await quizzes.deleteQuizzesByFolderId(folderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteMany).toHaveBeenCalledWith({ folderId });
        });

        it('should return false if no quizzes are deleted', async () => {
            const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteMany.mockResolvedValue({deletedCount: 0});

            const result = await quizzes.deleteQuizzesByFolderId(folderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteMany).toHaveBeenCalledWith({ folderId });
            expect(result).toBe(false);
        });
    });

    // update
    describe('update', () => {
        it('should update the title and content of the quiz', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'Updated Quiz';
            const newContent = 'This is an updated quiz.';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 1});

            await quizzes.update(quizId, newTitle, newContent);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(quizId) },
                { $set: { title: newTitle, content: newContent, updated_at: expect.any(Date) } }
            );
        });

        it('should return false if the quiz does not exist', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'Updated Quiz';
            const newContent = 'This is an updated quiz.';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 0});

            const result = await quizzes.update(quizId, newTitle, newContent);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(quizId) },
                { $set: { title: newTitle, content: newContent, updated_at: expect.any(Date) } }
            );
            expect(result).toBe(false);
        });
    });

    // move
    describe('move', () => {
        it('should move the quiz to a new folder', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newFolderId = '507f1f77bcf86cd799439011';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 1});

            await quizzes.move(quizId, newFolderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(quizId) },
                { $set: { folderId: newFolderId } }
            );
        });

        it('should return false if the quiz does not exist', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newFolderId = '507f1f77bcf86cd799439011';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 0});

            const result = await quizzes.move(quizId, newFolderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(quizId) },
                { $set: { folderId: newFolderId } }
            );
            expect(result).toBe(false);
        });
    });

    // duplicate
    describe('duplicate', () => {
    
        it('should duplicate the quiz and return the new quiz ID', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuizId = ObjectId.createFromTime(Math.floor(Date.now() / 1000)); // Corrected ObjectId creation
            const sourceQuiz = {
                title: 'Test Quiz',
                content: 'This is a test quiz.',
            };
    
            // Mock the response from getContent
            const getContentMock = jest.spyOn(quizzes, 'getContent').mockResolvedValue(sourceQuiz);
            const createMock = jest.spyOn(quizzes, 'create').mockResolvedValue(newQuizId);
            // mock the response from quizExists
            jest.spyOn(quizzes, 'quizExists').mockResolvedValue(false);

            const result = await quizzes.duplicate(quizId, userId);
    
            expect(result).toBe(newQuizId);
    
            // Ensure mocks were called correctly
            expect(getContentMock).toHaveBeenCalledWith(quizId);
            expect(createMock).toHaveBeenCalledWith(
                sourceQuiz.title + ' (1)',
                sourceQuiz.content,
                undefined,
                userId
            );
        });

        // Add test case for quizExists (name with number in parentheses)
        it('should create a new title if the quiz title already exists and ends with " (1)"', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuizId = ObjectId.createFromTime(Math.floor(Date.now() / 1000));
            const sourceQuiz = {
                title: 'Test Quiz (1)',
                content: 'This is a test quiz.',
            };
    
            // Mock the response from getContent
            const getContentMock = jest.spyOn(quizzes, 'getContent').mockResolvedValue(sourceQuiz);
            const createMock = jest.spyOn(quizzes, 'create').mockResolvedValue(newQuizId);
            // mock the response from quizExists
            jest.spyOn(quizzes, 'quizExists').mockResolvedValueOnce(false);
    
            const result = await quizzes.duplicate(quizId, userId);
    
            expect(result).toBe(newQuizId);
    
            // Ensure mocks were called correctly
            expect(getContentMock).toHaveBeenCalledWith(quizId);
            expect(createMock).toHaveBeenCalledWith(
                'Test Quiz (2)',
                sourceQuiz.content,
                undefined,
                userId
            );
        });

        // test case for duplication of "C (1)" but "C (2)" already exists, so it should create "C (3)"
        it('should create a new title if the quiz title already exists and ends with " (n)" but the incremented n also exists', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuizId = ObjectId.createFromTime(Math.floor(Date.now() / 1000));
            const sourceQuiz = {
                title: 'Test Quiz (1)',
                content: 'This is a test quiz.',
            };
    
            // Mock the response from getContent
            const getContentMock = jest.spyOn(quizzes, 'getContent').mockResolvedValue(sourceQuiz);
            const createMock = jest.spyOn(quizzes, 'create').mockResolvedValue(newQuizId);
            // mock the response from quizExists
            jest.spyOn(quizzes, 'quizExists').mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    
            const result = await quizzes.duplicate(quizId, userId);
    
            expect(result).toBe(newQuizId);
    
            // Ensure mocks were called correctly
            expect(getContentMock).toHaveBeenCalledWith(quizId);
            expect(createMock).toHaveBeenCalledWith(
                'Test Quiz (3)',
                sourceQuiz.content,
                undefined,
                userId
            );
        });
        
        it('should throw an error if the quiz does not exist', async () => {
            const quizId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
    
            // Mock the response from getContent
            jest.spyOn(quizzes, 'getContent').mockResolvedValue(null);
    
            await expect(quizzes.duplicate(quizId, userId)).rejects.toThrow();
        });
    });
});
