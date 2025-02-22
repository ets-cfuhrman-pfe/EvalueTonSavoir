const Rooms = require('../models/room');
const ObjectId = require('mongodb').ObjectId;

describe('Rooms', () => {
    let rooms;
    let db;
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
        };

        // Mock the database connection
        db = {
            connect: jest.fn(),
            getConnection: jest.fn().mockReturnThis(), // Add getConnection method
            collection: jest.fn().mockReturnValue(collection),
        };        

        rooms = new Rooms(db);

    });

    // create
    describe('create', () => {
        it('should create a new room and return the new room ID', async () => {
            const title = 'Test Room';

            // Mock the database response
            collection.findOne.mockResolvedValue(null);
            collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

            const result = await rooms.create(title, '12345');

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title, userId: '12345' });
            expect(collection.insertOne).toHaveBeenCalledWith(expect.objectContaining({ title, userId: '12345' }));
            expect(result).toBeDefined();
        });

        // throw an error if userId is undefined
        it('should throw an error if userId is undefined', async () => {
            const title = 'Test Room';

            await expect(rooms.create(title, undefined)).rejects.toThrow('Missing required parameter(s)');

            expect(db.connect).not.toHaveBeenCalled();
        });

        it('should throw an error if the room already exists', async () => {
            const title = 'Existing Room';
            const userId = '66fc70bea1b9e87655cf17c9';

            // Mock the database response of a found room
            collection.findOne.mockResolvedValue(
                // real result from mongosh
                {
                    _id: ObjectId.createFromHexString('66fd33fd81758a882ce99aae'),
                    userId: userId,
                    title: title,
                    created_at: new Date('2024-10-02T11:52:29.797Z')
                }
            );

            await expect(rooms.create(title, userId)).rejects.toThrow('Room already exists');

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title, userId: userId });
        });
    });

    // getUserRooms
    describe('getUserRooms', () => {
        it('should return all rooms for a user', async () => {
            const userId = '12345';
            const userRooms = [
                { title: 'Room 1', userId },
                { title: 'Room 2', userId },
            ];

            // Mock the database response
            collection.find().toArray.mockResolvedValue(userRooms);

            const result = await rooms.getUserRooms(userId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.find).toHaveBeenCalledWith({ userId });
            expect(result).toEqual(userRooms);
        });
    });

    // getOwner
    describe('getOwner', () => {
        it('should return the owner of a room', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ userId });

            const result = await rooms.getOwner(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) });
            expect(result).toBe(userId);
        });
    });

    // write a test for getContent
    describe('getContent', () => {
        it('should return the content of a room', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const content = [
                { title: 'Salle 1', content: [] },
                { title: 'Salle 2', content: [] },
            ];

            // Mock the database response
            collection.find().toArray.mockResolvedValue(content);

            const result = await rooms.getContent(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('files');
            expect(collection.find).toHaveBeenCalledWith({ roomId });
            expect(result).toEqual(content);
        });

        it('should return an empty array if the room has no content', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.find().toArray.mockResolvedValue([]);

            const result = await rooms.getContent(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('files');
            expect(collection.find).toHaveBeenCalledWith({ roomId });
            expect(result).toEqual([]);
        });
    });

    describe('delete', () => {
        it('should delete a room and return true', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const result = await rooms.delete(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) });
            expect(result).toBe(true);
        });

        it('should return false if the room does not exist', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            
            // Mock the database response
            collection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const result = await rooms.delete(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) });
            expect(result).toBe(false);
        });
    });

    // rename
    describe('rename', () => {
        it('should rename a room and return true', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'New Room Name';
            const userId = '12345';

            // Mock the database response
            collection.updateOne.mockResolvedValue({ modifiedCount: 1 });

            const result = await rooms.rename(roomId, userId, newTitle);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            // { _id: ObjectId.createFromHexString(roomId), userId: userId }, { $set: { title: newTitle } }
            expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId), userId: userId }, { $set: { title: newTitle } });
            expect(result).toBe(true);
        });

        it('should return false if the room does not exist', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'New Room Name';
            const userId = '12345';

            // Mock the database response
            collection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
            const result = await rooms.rename(roomId, userId, newTitle);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId), userId: userId }, { $set: { title: newTitle } });
            expect(result).toBe(false);
        });

        it('should throw an error if the new title is already in use', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const newTitle = 'Existing Room';
            const userId = '12345';

            // Mock the database response
            collection.findOne.mockResolvedValue({ title: newTitle });
            collection.updateOne.mockResolvedValue({ modifiedCount: 0 });
            
            await expect(rooms.rename(roomId, userId, newTitle)).rejects.toThrow(`Room with name '${newTitle}' already exists.`);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            // expect(collection.updateOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) }, { $set: { title: newTitle } });
            expect(collection.findOne).toHaveBeenCalledWith({ userId: userId, title: newTitle });
        });
    });
    
    describe('roomExists', () => {
        it('should return true if room exists', async () => {
            const title = 'Test Room';

            // Mock the database response
            collection.findOne.mockResolvedValue({ title });

            const result = await rooms.roomExists(title);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title });
            expect(result).toBe(true);
        });

        it('should return false if room does not exist', async () => {
            const title = 'Nonexistent Room';
            // Mock the database response
            collection.findOne.mockResolvedValue(null);

            const result = await rooms.roomExists(title);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title });
            expect(result).toBe(false);
        });
    });

    // write a test for getRoomById
    describe('getRoomById', () => {
        it('should return a room by ID', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';
            const room = {
                _id: new ObjectId(roomId),
                title: 'Test Room',
            };

            // Mock the database response
            collection.findOne.mockResolvedValue(room);

            const result = await rooms.getRoomById(roomId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) });
            expect(result).toEqual(room);
        });

        it('should throw an error if the room does not exist', async () => {
            const roomId = '60c72b2f9b1d8b3a4c8e4d3b';

            // Mock the database response
            collection.findOne.mockResolvedValue(null);

            await expect(rooms.getRoomById(roomId)).resolves.toThrow(`Room ${roomId} not found`);

            expect(db.connect).toHaveBeenCalled();
            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ _id: new ObjectId(roomId) });
        });
    });
});
