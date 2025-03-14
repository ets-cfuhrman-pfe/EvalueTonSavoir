const Folder = require('../models/folders');
const Quiz = require('../models/quizzes');
const db = require('../config/db');

console.log('db:', db); // Debugging line
console.log('db.getConnection:', db.getConnection); // Debugging line

describe('Folders', () => {
    const folder = new Folder(db, new Quiz(db));
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

    // beforeEach(() => {
    //     jest.clearAllMocks(); // Clear any previous mock calls

    //     // Mock the collection object
    //     collection = {
    //         findOne: jest.fn(),
    //         insertOne: jest.fn(),
    //         find: jest.fn().mockReturnValue({ toArray: jest.fn() }), // Mock the find method
    //         deleteOne: jest.fn(),
    //         deleteMany: jest.fn(),
    //         updateOne: jest.fn(),
    //     };

    //     // Mock the database connection
    //     db = {
    //         connect: jest.fn(),
    //         getConnection: jest.fn().mockReturnThis(), // Add getConnection method
    //         collection: jest.fn().mockReturnValue(collection),
    //     };        

    //     quizzes = new Quizzes(db);
    //     folders = new Folders(db, quizzes);

    // });

    // // create
    // describe('create', () => {
    //     it('should create a new folder and return the new folder ID', async () => {
    //         const title = 'Test Folder';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue(null);
    //         collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    //         const result = await folders.create(title, '12345');

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ title, userId: '12345' });
    //         expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({ title, userId: '12345' }));
    //         expect(result).toBeDefined();
    //     });

    //     // throw an error if userId is undefined
    //     it('should throw an error if userId is undefined', async () => {
    //         const title = 'Test Folder';

    //         await expect(folders.create(title, undefined)).rejects.toThrow('Missing required parameter(s)');

    //         expect(db.connect).not.toHaveBeenCalled();
    //     });

    //     it('should throw an error if the folder already exists', async () => {
    //         const title = 'Existing Folder';
    //         const userId = '66fc70bea1b9e87655cf17c9';

    //         // Mock the database response of a found folder
    //         collection.findOne.mockResolvedValue(
    //             // real result from mongosh
    //             {
    //                 _id: ObjectId.createFromHexString('66fd33fd81758a882ce99aae'),
    //                 userId: userId,
    //                 title: title,
    //                 created_at: new Date('2024-10-02T11:52:29.797Z')
    //             }
    //         );

    //         await expect(folders.create(title, userId)).rejects.toThrow('Folder already exists');

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ title, userId: userId });
    //     });
    // });

    // // getUserFolders
    // describe('getUserFolders', () => {
    //     it('should return all folders for a user', async () => {
    //         const userId = '12345';
    //         const userFolders = [
    //             { title: 'Folder 1', userId },
    //             { title: 'Folder 2', userId },
    //         ];

    //         // Mock the database response
    //         collection.find().toArray.mockResolvedValue(userFolders);

    //         const result = await folders.getUserFolders(userId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.find).toHaveBeenCalledWith({ userId });
    //         expect(result).toEqual(userFolders);
    //     });
    // });

    // // getOwner
    // describe('getOwner', () => {
    //     it('should return the owner of a folder', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const userId = '12345';

    //         // Mock the database response
    //         collection.findOne.mockResolvedValue({ userId });

    //         const result = await folders.getOwner(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('folders');
    //         expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(folderId) });
    //         expect(result).toBe(userId);
    //     });
    // });

    // // write a test for getContent
    // describe('getContent', () => {
    //     it('should return the content of a folder', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';
    //         const content = [
    //             { title: 'Quiz 1', content: [] },
    //             { title: 'Quiz 2', content: [] },
    //         ];

    //         // Mock the database response
    //         collection.find().toArray.mockResolvedValue(content);

    //         const result = await folders.getContent(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('files');
    //         expect(collection.find).toHaveBeenCalledWith({ folderId });
    //         expect(result).toEqual(content);
    //     });

    //     it('should return an empty array if the folder has no content', async () => {
    //         const folderId = '60c72b2f9b1d8b3a4c8e4d3b';

    //         // Mock the database response
    //         collection.find().toArray.mockResolvedValue([]);

    //         const result = await folders.getContent(folderId);

    //         expect(db.connect).toHaveBeenCalled();
    //         expect(db.collection).toHaveBeenCalledWith('files');
    //         expect(collection.find).toHaveBeenCalledWith({ folderId });
    //         expect(result).toEqual([]);
    //     });
    // });

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
