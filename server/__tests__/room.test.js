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

        collection.findOne.mockResolvedValue(null);
        collection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

        const room = new Room(roomID, roomName, hostname);

        const result = await roomRepo.create(room);

        expect(db.connect).toHaveBeenCalled();
        expect(db.getConnection).toHaveBeenCalled();
        expect(collection.findOne).toHaveBeenCalled();
        expect(result).toBeDefined();
    });

    it('should throw an error if a room with same ID exists', async () => {
        const roomID = '123456';
        const roomName = 'room123456';
        const hostname = 'localhost';

        collection.findOne.mockResolvedValue({ id: roomID });

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

        expect(result.id).toBe("123456");
    });

    it('should get null if no room with id is found', async () => {
        const roomID = '123456';
        collection.findOne.mockResolvedValue(null);

        const result = await roomRepo.get(roomID);

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
        expect(result).toEqual(rooms);
    });

    // TODO : add update() test

    it('should delete existing room', async () => {
        collection.deleteOne.mockReturnValue({ id: '123456' });
        const result = await roomRepo.delete('123456');

        expect(result).toBeTruthy();
    });

});
