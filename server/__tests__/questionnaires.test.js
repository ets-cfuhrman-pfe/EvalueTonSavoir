const { ObjectId } = require('mongodb');
const Questionnaires = require('../models/questionnaires'); // Adjust the path as necessary

describe('Questionnaires', () => {
    let db;
    let questionnaires;
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

        // Initialize the Questionnaire model with the mocked db
        questionnaires = new Questionnaires(db);
    });

    describe('create', () => {
        it('should create a new questionnaire if it does not exist', async () => {
            const title = 'Test Questionnaire';
            const content = 'This is a test questionnaire.';
            const folderId = '507f1f77bcf86cd799439011';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue(null);
            collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const result = await questionnaires.create(title, content, folderId, userId);

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

        it('should throw exception if the questionnaire already exists', async () => {
            const title = 'Test Questionnaire';
            const content = 'This is a test questionnaire.';
            const folderId = '507f1f77bcf86cd799439011';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ title });

            await expect(questionnaires.create(title, content, folderId, userId)).rejects.toThrow(`Questionnaire already exists with title: ${title}, folderId: ${folderId}, userId: ${userId}`);
        });
    });

    describe('getOwner', () => {
        it('should return the owner of the questionnaire', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ userId });

            const result = await questionnaires.getOwner(questionnaireId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(questionnaireId) });
            expect(result).toBe(userId);
        });
    });

    describe('getContent', () => {
        it('should return the content of the questionnaire', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const content = 'This is a test questionnaire.';

            // Mock the database response
            collection.findOne.mockResolvedValue({ content });

            const result = await questionnaires.getContent(questionnaireId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.findOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(questionnaireId) });
            expect(result).toEqual({ content });
        });
    });

    describe('delete', () => {
        it('should delete the questionnaire', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteOne.mockResolvedValue({deletedCount: 1});

            await questionnaires.delete(questionnaireId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(questionnaireId) });
        });
    
        it('should return false if the questionnaire does not exist', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
    
            // Mock the database response
            collection.deleteOne.mockResolvedValue({deletedCount: 0});
    
            const result = await questionnaires.delete(questionnaireId);
    
            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(questionnaireId) });
            expect(result).toBe(false);
        });
    });

    // deleteQuestionnairesByFolderId
    describe('deleteQuestionnairesByFolderId', () => {
        it('should delete all questionnaires in a folder', async () => {
            const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteMany.mockResolvedValue({deletedCount: 2});

            await questionnaires.deleteQuestionnairesByFolderId(folderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteMany).toHaveBeenCalledWith({ folderId });
        });

        it('should return false if no questionnaires are deleted', async () => {
            const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteMany.mockResolvedValue({deletedCount: 0});

            const result = await questionnaires.deleteQuestionnairesByFolderId(folderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.deleteMany).toHaveBeenCalledWith({ folderId });
            expect(result).toBe(false);
        });
    });

    // update
    describe('update', () => {
        it('should update the title and content of the questionnaire', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'Updated Questionnaire';
            const newContent = 'This is an updated questionnaire.';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 1});

            await questionnaires.update(questionnaireId, newTitle, newContent);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(questionnaireId) },
                { $set: { title: newTitle, content: newContent, updated_at: expect.any(Date) } }
            );
        });

        it('should return false if the questionnaire does not exist', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'Updated Questionnaire';
            const newContent = 'This is an updated questionnaire.';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 0});

            const result = await questionnaires.update(questionnaireId, newTitle, newContent);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(questionnaireId) },
                { $set: { title: newTitle, content: newContent, updated_at: expect.any(Date) } }
            );
            expect(result).toBe(false);
        });
    });

    // move
    describe('move', () => {
        it('should move the questionnaire to a new folder', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newFolderId = '507f1f77bcf86cd799439011';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 1});

            await questionnaires.move(questionnaireId, newFolderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(questionnaireId) },
                { $set: { folderId: newFolderId } }
            );
        });

        it('should return false if the questionnaire does not exist', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newFolderId = '507f1f77bcf86cd799439011';

            // Mock the database response
            collection.updateOne.mockResolvedValue({modifiedCount: 0});

            const result = await questionnaires.move(questionnaireId, newFolderId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalledWith(
                { _id: ObjectId.createFromHexString(questionnaireId) },
                { $set: { folderId: newFolderId } }
            );
            expect(result).toBe(false);
        });
    });

    // duplicate
    describe('duplicate', () => {
    
        it('should duplicate the questionnaire and return the new questionnaire ID', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuestionnaireId = ObjectId.createFromTime(Math.floor(Date.now() / 1000)); // Corrected ObjectId creation
            const sourceQuestionnaire = {
                title: 'Test Questionnaire',
                content: 'This is a test questionnaire.',
            };
    
            const createMock = jest.spyOn(questionnaires, 'create').mockResolvedValue(newQuestionnaireId);
            // mock the findOne method
            jest.spyOn(collection, 'findOne')
                .mockResolvedValueOnce(sourceQuestionnaire) // source questionnaire exists
                .mockResolvedValueOnce(null); // new name is not found

            const result = await questionnaires.duplicate(questionnaireId, userId);
    
            expect(result).toBe(newQuestionnaireId);
    
            // Ensure mocks were called correctly
            expect(createMock).toHaveBeenCalledWith(
                sourceQuestionnaire.title + ' (1)',
                sourceQuestionnaire.content,
                undefined,
                userId
            );
        });

        // Add test case for questionnaireExists (name with number in parentheses)
        it('should create a new title if the questionnaire title already exists and ends with " (1)"', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuestionanireId = ObjectId.createFromTime(Math.floor(Date.now() / 1000));
            const sourceQuestionnaire = {
                title: 'Test Questionnaire (1)',
                content: 'This is a test questionnaire.',
            };
    
            const createMock = jest.spyOn(questionnaires, 'create').mockResolvedValue(newQuestionanireId);
            // mock the findOne method
            jest.spyOn(collection, 'findOne')
                .mockResolvedValueOnce(sourceQuestionnaire) // source questionnaire exists
                .mockResolvedValueOnce(null); // new name is not found
    
            const result = await questionnaires.duplicate(questionnaireId, userId);
    
            expect(result).toBe(newQuestionanireId);
    
            // Ensure mocks were called correctly
            expect(createMock).toHaveBeenCalledWith(
                'Test Questionnaire (2)',
                sourceQuestionnaire.content,
                undefined,
                userId
            );
        });

        // test case for duplication of "C (1)" but "C (2)" already exists, so it should create "C (3)"
        it('should create a new title if the questionnaire title already exists and ends with " (n)" but the incremented n also exists', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
            const newQuestionnaireId = ObjectId.createFromTime(Math.floor(Date.now() / 1000));
            const sourceQuestionnaire = {
                title: 'Test Questionnaire (1)',
                content: 'This is a test questionnaire.',
            };
    
            const createMock = jest.spyOn(questionnaires, 'create').mockResolvedValue(newQuestionnaireId);

            // mock the findOne method
            jest.spyOn(collection, 'findOne')
                .mockResolvedValueOnce(sourceQuestionnaire) // source questionnaire exists
                .mockResolvedValueOnce({ title: 'Test Questionnaire (2)' }) // new name collision
                .mockResolvedValueOnce(null); // final new name is not found
    
            const result = await questionnaires.duplicate(questionnaireId, userId);
    
            expect(result).toBe(newQuestionnaireId);
    
            // Ensure mocks were called correctly
            expect(createMock).toHaveBeenCalledWith(
                'Test Questionnaire (3)',
                sourceQuestionnaire.content,
                undefined,
                userId
            );
        });
        
        it('should throw an error if the questionnaire does not exist', async () => {
            const questionnaireId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';
    
            // Mock the response from getContent
            jest.spyOn(questionnaires, 'getContent').mockResolvedValue(null);
    
            await expect(questionnaires.duplicate(questionnaireId, userId)).rejects.toThrow();
        });
    });
});
