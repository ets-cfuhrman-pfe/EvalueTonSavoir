const Rooms = require('../models/room');

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

    // Test for getRoomTitleByUserId
    describe('getRoomTitleByUserId', () => {
        it('should return the titles of all rooms for a given userId', async () => {
            const userId = '678561cac3e923c972d2d930';
            const roomsData = [
                { title: 'Salle 1', userId },
                { title: 'Salle 2', userId },
            ];

            collection.find().toArray.mockResolvedValue(roomsData);

            const result = await rooms.getRoomTitleByUserId(userId);

            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.find).toHaveBeenCalledWith({ userId });
            expect(result).toEqual(['Salle 1', 'Salle 2']);
        });

        it('should return an empty array if no rooms are found for the given userId', async () => {
            const userId = '12345';

            collection.find().toArray.mockResolvedValue([]);

            const result = await rooms.getRoomTitleByUserId(userId);

            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.find).toHaveBeenCalledWith({ userId });
            expect(result).toEqual([]);
        });
    });


    // Test for roomExists
    describe('roomExists', () => {
        it('should return true if the room exists', async () => {
            const title = 'Numero Salle test 0';

            collection.findOne.mockResolvedValue({ title });

            const result = await rooms.roomExists(title);

            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title });
            expect(result).toBe(true);
        });


        it('should return false if the room does not exist', async () => {
            const title = 'Non-existent Room';

            collection.findOne.mockResolvedValue(null);

            const result = await rooms.roomExists(title);

            expect(db.collection).toHaveBeenCalledWith('rooms');
            expect(collection.findOne).toHaveBeenCalledWith({ title }); 
            expect(result).toBe(false);
        });

    });

});
