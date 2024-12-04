const { RoomRepository, Room } = require('../models/room');
const { ObjectId } = require('mongodb');

describe('Room model tests', () => {
    let room;

    it('should create new Room model', () => {
        room = new Room('1234', 'roomName', 'localhost', 5);

        expect(room.id).toBe('1234');
        expect(room.name).toBe('roomName');
        expect(room.host).toBe('http://localhost');
        expect(room.nbStudents).toBe(5);
        expect(room.mustBeCleaned).toBeFalsy();
    });
});

describe('Rooms', () => {
    let collection;
    let db;

    let room;
    let roomRepo;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the collection object
        collection = {
            findOne: jest.fn(),
            insertOne: jest.fn(), // Mock the insertOne method
            find: jest.fn().mockReturnValue({ toArray: jest.fn() }), // Mock the find method
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
            updateOne: jest.fn(),
        };

        // Mock the database connection
        db = {
            connect: jest.fn(),
            getConnection: jest.fn().mockReturnValue({
                collection: jest.fn().mockReturnValue(collection),
            }), // Add getConnection method
        };        

        roomRepo = new RoomRepository(db);
    });

    it('should create a new room if it does not exist', async () => {
        const roomID = '123456';
        const roomName = 'room123456';
        const hostname = 'localhost';
        const mongoObjectID = new ObjectId();

        // Mock first findOne to simulate no entry
        collection.findOne.mockResolvedValueOnce(null);

        //Mock second findOne to simulate new room
        collection.findOne.mockResolvedValueOnce({
            _id: mongoObjectID,
            id: roomID,
            name: roomName,
            host: hostname,
        });

        collection.insertOne.mockResolvedValue({ insertedId: mongoObjectID });

        const room = new Room(roomID, roomName, hostname);

        const result = await roomRepo.create(room);

        expect(db.connect).toHaveBeenCalled();
        expect(db.getConnection).toHaveBeenCalled();
        expect(collection.findOne).toHaveBeenCalledWith({id: '123456'});
    });

    it('should throw an error if a room with same ID exists', async () => {
        const roomID = '123456';
        const roomName = 'otherRoom';
        const hostname = 'localhost';
        const mongoObjectID = new ObjectId();

        collection.findOne.mockResolvedValueOnce({
            _id: mongoObjectID,
            id: roomID,
            name: roomName,
            host: hostname,
        });

        const room = new Room(roomID, roomName, hostname);

        await expect(roomRepo.create(room)).rejects.toThrow('Érreur: la salle 123456 existe déja');

        expect(db.connect).toHaveBeenCalled();
        expect(db.getConnection).toHaveBeenCalled();
        expect(collection.findOne).toHaveBeenCalled();
    });

    it('should get the room with existing id', async () => {
        const roomID = '123456';
        collection.findOne.mockResolvedValue({ id: roomID });

        const result = await roomRepo.get(roomID);

        expect(db.connect).toHaveBeenCalled();
        expect(db.getConnection).toHaveBeenCalled();
        expect(collection.findOne).toHaveBeenCalled();
        expect(result.id).toBe("123456");
    });

    it('should get null if no room with id is found', async () => {
        const roomID = '123456';
        collection.findOne.mockResolvedValue(null);

        const result = await roomRepo.get(roomID);

        expect(db.connect).toHaveBeenCalled();
        expect(db.getConnection).toHaveBeenCalled();
        expect(collection.findOne).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it('should return all rooms', async () => {
        const rooms = [
            { id: '123456', name: 'room123456' },
            { id: '789012', name: 'room789012' },
        ];

        // Mock the database response
        collection.find().toArray.mockResolvedValue(rooms);

        const result = await roomRepo.getAll();

        expect(db.connect).toHaveBeenCalled();
        expect(collection.find).toHaveBeenCalled();
        expect(result).toEqual(rooms);
    });

    // matchedCount : number of document matching the id
    // modifiedCount : number of modified documents, matching the id
    // expectedResult : true or false wether the update happened or not
    const cases = [[0, 0, false], [0, 1, true], [1, 0, true], [1, 1, true]];
    test.each(cases)(
        "Given %p as modified count and %p as matched count, return %p",
        async (modifiedCount, matchedCount, expectedResult) => {
            collection.updateOne.mockResolvedValue({
                matchedCount: matchedCount,
                modifiedCount: modifiedCount
            });

            const updatedRoom = new Room('123456', 'roomName', 'hostname');
            const result = await roomRepo.update(updatedRoom);

            expect(db.connect).toHaveBeenCalled();
            expect(collection.updateOne).toHaveBeenCalled();
            expect(result).toBe(expectedResult);
        }
    );

    it('should delete existing room', async () => {
        const mongoObjectID = new ObjectId();
        const roomID = '123456';

        collection.deleteOne.mockResolvedValue({
            deletedCount: 1,
        });

        const result = await roomRepo.delete(roomID);

        expect(result).toBeTruthy();
    });

    it('should not delete un-existing room', async () => {
        const mongoObjectID = new ObjectId();
        const roomID = '123456';

        collection.deleteOne.mockResolvedValue({
            deletedCount: 0,
        });

        const result = await roomRepo.delete(roomID);

        expect(result).toBeFalsy();
    });
});
