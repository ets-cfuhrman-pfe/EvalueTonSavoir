const Folder = require('../models/folder');
const Quiz = require('../models/quiz');
const db = require('../config/db');

console.log('db:', db); // Debugging line
console.log('db.getConnection:', db.getConnection); // Debugging line

describe('Folders', () => {
    const quiz = new Quiz(db);
    const folder = new Folder(db, quiz);
    let database;

    beforeAll(async () => {
        console.log('beforeAll: db.getConnection:', db.getConnection); // Debugging line
        database = await db.getConnection();
    });

    afterAll(async () => {
        await db.closeConnection();
    });

    // it('should insert a folder into collection', async () => {
    //     const folders = new Folder(db, Quiz);
    //     const folderId = await folders.create('Test Folder', '12345');
    //     const result = await database.collection('folders').findOne({ _id: folderId });
    //     expect(result).toBeTruthy();
    //     console.log('found folder result:', result); // Debugging line
    //     expect(result.title).toBe('Test Folder');
    // });

    describe('create', () => {
        it('should create a new folder and return the new folder ID', async () => {
            const title = 'Test Folder';
            const userId = '12345';

            // Ensure the folder does not exist before the test
            await database.collection('folders').deleteMany({ title, userId });

            const result = await folder.create(title, userId);

            const createdFolder = await database.collection('folders').findOne({ _id: result });

            expect(createdFolder).toBeTruthy();
            expect(createdFolder.title).toBe(title);
            expect(createdFolder.userId).toBe(userId);
        });

        it('should throw an error if userId is undefined', async () => {
            const title = 'Test Folder';

            await expect(folder.create(title, undefined)).rejects.toThrow('Missing required parameter(s)');
        });

        it('should throw an error if the folder already exists', async () => {
            const title = 'Existing Folder';
            const userId = '12345';

            // Ensure the folder exists before the test
            await database.collection('folders').insertOne({ title, userId, created_at: new Date() });

            await expect(folder.create(title, userId)).rejects.toThrow('Folder already exists');

            // Clean up
            await database.collection('folders').deleteMany({ title, userId });
        });
    });


    // getUserFolders
    describe('getUserFolders', () => {
        it('should return all folders for a user', async () => {
            const userId = '12345';
            const userFolders = [
                { title: 'Folder 1', userId },
                { title: 'Folder 2', userId },
            ];
            // Ensure the folders do not exist before the test
            await database.collection('folders').deleteMany({ userId });
            
            // Insert the folders
            await database.collection('folders').insertMany(userFolders);

            const result = await folder.getUserFolders(userId);
            
            expect(result).toEqual(userFolders);

            // Clean up
            await database.collection('folders').deleteMany({ userId });

        });
    });

    // getOwner
    describe('getOwner', () => {
        it('should return the owner of a folder', async () => {
            // userId must be 24-char hex string
            const userId = '60c72b2f9b1d8b3a4c8e4d3b';

            expect(userId.length).toBe(24);
            expect(/^[0-9A-Fa-f]{24}$/.test(userId)).toBe(true);

            // create the folder using the folder API
            const folderId = await folder.create('Test Folder', userId);

            const folderIdString = folderId.toString();

            expect(folderIdString.length).toBe(24);
            expect(/^[0-9A-Fa-f]{24}$/.test(folderIdString)).toBe(true);

            const result = await folder.getOwner(folderIdString);

            expect(result).toBe(userId);
        });
    });

    // write a test for getContent
    describe('getContent', () => {
        it('should return the content of a folder', async () => {

            // create a new folder
            const folderId = await folder.create('Test Folder', '12345');

            // Insert the content using the quiz API
            const _quiz1ObjectId = await quiz.create('Quiz 1', [], folderId.toString(), '12345');
            const _quiz2ObjectId = await quiz.create('Quiz 2', [], folderId.toString(), '12345');

            const content = [
                { title: 'Quiz 1', content: [], _id: _quiz1ObjectId, created_at: expect.any(Date), updated_at: expect.any(Date), folderId: folderId.toString(), userId: '12345' },
                { title: 'Quiz 2', content: [], _id: _quiz2ObjectId, created_at: expect.any(Date), updated_at: expect.any(Date), folderId: folderId.toString(), userId: '12345' },
            ];

            const result = await folder.getContent(folderId.toString());

            expect(result).toEqual(content);

            // Clean up
            await database.collection('files').deleteMany({ folderId: folderId.toString() });
            await database.collection('folders').deleteMany({ _id: folderId });
        });

        it('should return an empty array if the folder has no content', async () => {
            // create a new folder
            const folderId = await folder.create('Test Folder', '12345');

            const content = [];
            const result = await folder.getContent(folderId.toString());

            expect(result).toEqual(content);

            // Clean up
            await database.collection('folders').deleteMany({ _id: folderId });
        });
    });

    // delete
    describe('delete', () => {
        it('should delete a folder and return true', async () => {
            const folderId = await folder.create('Test Folder', '12345');

            // Insert the content using the quiz API
            const _quiz1ObjectId = await quiz.create('Quiz 1', [], folderId.toString(), '12345');
            const _quiz2ObjectId = await quiz.create('Quiz 2', [], folderId.toString(), '12345');

            const result = await folder.delete(folderId.toString());

            expect(result).toBe(true);

            // make sure quizzes were deleted
            const quiz1 = await database.collection('files').findOne({ _id: _quiz1ObjectId });
            const quiz2 = await database.collection('files').findOne({ _id: _quiz2ObjectId });

            expect(quiz1).toBeNull();
            expect(quiz2).toBeNull();

            // Clean up
            await database.collection('files').deleteMany({ folderId: folderId.toString() });
            await database.collection('folders').deleteMany({ _id: folderId });
        });

    });
            
    // // delete
    // describe('delete', () => {
    //     it('should delete a folder and return true', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

    //         // Mock the database response
    //         collection.deleteOne.mockResolvedValue({ deletedCount: 1 });


    //         // Mock the folders.quizModel.deleteQuizzesByFolderId()
    //         jest.spyOn(quizzes, 'deleteQuizzesByFolderId').mockResolvedValue(true);

    //         const result = await folders.delete(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         expect(result).toBe(true);
    //     });

    //     it('should return false if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
            
    //         // Mock the database response
    //         collection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    //         const result = await folders.delete(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         expect(result).toBe(false);
    //     });
    // });

    // // rename
    // describe('rename', () => {
    //     it('should rename a folder and return true', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const newTitle = 'New Folder Name';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    //         const result = await folders.rename(folderId, userId, newTitle);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         // { _id: ObjectId.createFromHexString(folderId), userId: userId }, { $set: { title: newTitle } }
    //         expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId), userId: userId }, { $set: { title: newTitle } });
    //         expect(result).toBe(true);
    //     });

    //     it('should return false if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const newTitle = 'New Folder Name';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
    //         const result = await folders.rename(folderId, userId, newTitle);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId), userId: userId }, { $set: { title: newTitle } });
    //         expect(result).toBe(false);
    //     });

    //     it('should throw an error if the new title is already in use', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const newTitle = 'Existing Folder';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue({ title: newTitle });
    //         collection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
    //         await expect(folders.rename(folderId, userId, newTitle)).rejects.toThrow(`Folder with name '${newTitle}' already exists.`);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         // expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) }, { $set: { title: newTitle } });
    //         expect(collection.findOne).toHaveBeenCalledWith({ userId: userId, title: newTitle });
    //     });
    // });

    // // duplicate
    // describe('duplicate', () => {
    //     it('should duplicate a folder and return the new folder ID', async () => {
    //         const userId = '12345';
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const sourceFolder = {title: 'SourceFolder', userId: userId, content: []};
    //         const duplicatedFolder = {title: 'SourceFolder (1)', userId: userId, created_at: expect.any(Date), content: []};

    //         // Mock the database responses for the folder and the new folder (first one is found, second one is null)
    //         // mock the findOne method
    //         jest.spyOn(collection, 'findOne')
    //             .mockResolvedValueOnce(sourceFolder) // source file exists
    //             .mockResolvedValueOnce(null); // new name is not found

    //         // Mock the folder create method
    //         const createSpy = jest.spyOn(folders, 'create').mockResolvedValue(new ObjectId());

    //         // mock the folder.getContent method
    //         jest.spyOn(folders, 'getContent').mockResolvedValue([{ title: 'Quiz 1', content: [] }]);

    //         // Mock the quizzes.create method
    //         jest.spyOn(quizzes, 'create').mockResolvedValue(new ObjectId());

    //         const result = await folders.duplicate(folderId, userId);

    //         expect(db.collection).toHaveBeenCalledWith('folders');

    //         // expect folders.create method was called
    //         expect(createSpy).toHaveBeenCalledWith(duplicatedFolder.title, userId);
    //         // expect the getContent method was called
    //         expect(folders.getContent).toHaveBeenCalledWith(folderId);
    //         // expect the quizzes.create method was called
    //         expect(quizzes.create).toHaveBeenCalledWith('Quiz 1', [], expect.any(String), userId);
            
    //         expect(result).toBeDefined();
    //     });

    //     it('should throw an error if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

    //         // Mock the database response for the source
    //         collection.findOne.mockResolvedValue(null);

    //         await expect(folders.duplicate(folderId, '54321')).rejects.toThrow(`Folder ${folderId} not found`);

    //         // expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId), userId: '54321' });
    //     });
    // });
    
    // describe('folderExists', () => {
    //     it('should return true if folder exists', async () => {
    //         const title = 'Test Folder';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue({ title, userId });

    //         const result = await folders.folderExists(title, userId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ title, userId });
    //         expect(result).toBe(true);
    //     });

    //     it('should return false if folder does not exist', async () => {
    //         const title = 'Nonexistent Folder';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue(null);

    //         const result = await folders.folderExists(title, userId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ title, userId });
    //         expect(result).toBe(false);
    //     });
    // });

    // describe('copy', () => {
    //     it('should copy a folder and return the new folder ID', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const userId = '12345';
    //         const newFolderId = new ObjectId();
    //         // Mock some quizzes that are in folder.content
    //         const sourceFolder = {
    //             title: 'Test Folder',
    //             content: [
    //                 { title: 'Quiz 1', content: [] },
    //                 { title: 'Quiz 2', content: [] },
    //             ],
    //         };

    //         // Mock the response from getFolderWithContent
    //         jest.spyOn(folders, 'getFolderWithContent').mockResolvedValue(sourceFolder);
    //         jest.spyOn(folders, 'create').mockResolvedValue(newFolderId);
    //         // Mock the response from Quiz.createQuiz
    //         jest.spyOn(quizzes, 'create').mockImplementation(() => {});

    //         const result = await folders.copy(folderId, userId);

    //         // expect(db.connect).toHaveBeenCalled();
    //         // expect(db.collection).toHaveBeenCalledWith('folders');
    //         // expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         // expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({ userId }));
    //         expect(result).toBe(newFolderId);
    //     });

    //     it('should throw an error if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const userId = '12345';

    //         // Mock the response from getFolderWithContent
    //         jest.spyOn(folders, 'getFolderWithContent').mockImplementation(() => {
    //             throw new Error(`Folder ${folderId} not found`);
    //         });

    //         await expect(folders.copy(folderId, userId)).rejects.toThrow(`Folder ${folderId} not found`);

    //         // expect(db.connect).toHaveBeenCalled();
    //         // expect(db.collection).toHaveBeenCalledWith('folders');
    //         // expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //     });
    // });

    // // write a test for getFolderWithContent
    // describe('getFolderWithContent', () => {
    //     it('should return a folder with content', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const folder = {
    //             _id: new ObjectId(folderId),
    //             title: 'Test Folder',
    //         };
    //         const content = {
    //             content :  [
    //             { title: 'Quiz 1', content: [] },
    //             { title: 'Quiz 2', content: [] },
    //         ]};

    //         // Mock the response from getFolderById
    //         jest.spyOn(folders, 'getFolderById').mockResolvedValue(folder);

    //         // Mock the response from getContent
    //         jest.spyOn(folders, 'getContent').mockResolvedValue(content);

    //         const result = await folders.getFolderWithContent(folderId);

    //         // expect(db.connect).toHaveBeenCalled();
    //         // expect(db.collection).toHaveBeenCalledWith('folders');
    //         // expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         expect(result).toEqual({
    //             ...folder,
    //             content: content
    //         });
    //     });

    //     it('should throw an error if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

    //         // // Mock the database response
    //         // collection.findOne.mockResolvedValue(null);

    //         // Mock getFolderById to throw an error
    //         jest.spyOn(folders, 'getFolderById').mockImplementation(() => {
    //             throw new Error(`Folder ${folderId} not found`);
    //         });

    //         await expect(folders.getFolderWithContent(folderId)).rejects.toThrow(`Folder ${folderId} not found`);

    //         // expect(db.connect).toHaveBeenCalled();
    //         // expect(db.collection).toHaveBeenCalledWith('folders');
    //         // expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //     });
    // });

    // // write a test for getFolderById
    // describe('getFolderById', () => {
    //     it('should return a folder by ID', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const folder = {
    //             _id: new ObjectId(folderId),
    //             title: 'Test Folder',
    //         };

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue(folder);

    //         const result = await folders.getFolderById(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         expect(result).toEqual(folder);
    //     });

    //     it('should throw an error if the folder does not exist', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue(null);

    //         await expect(folders.getFolderById(folderId)).resolves.toThrow(`Folder ${folderId} not found`);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //     });
    // });
});
