class Room {
    constructor(id, name, host, nbStudents = 0) { // Default nbStudents to 0
        this.id = id;
        this.name = name;
        this.host = host;
        this.nbStudents = nbStudents;
    }
}

class RoomRepository {
    constructor(db) {
        this.db = db;
        this.connection = null;
        this.collection = null;
    }

    async init() {
        if (!this.connection) {
            await this.db.connect();
            this.connection = this.db.getConnection();
        }
        if (!this.collection) this.collection = this.connection.collection('rooms');
    }

    async create(room) {
        await this.init();
        const existingRoom = await this.collection.findOne({ id: room.id });
        if (existingRoom) {
            throw new Error(`Room already exists with id: ${room.id}`);
        }
        const returnedId = await this.collection.insertOne(room);
        return await this.collection.findOne({ _id: returnedId.insertedId });
    }

    async get(id) {
        await this.init();
        const existingRoom = await this.collection.findOne({ id: id });
        if (!existingRoom) {
            console.warn(`Room with id ${id} not found.`);
            return null;
        }
        return existingRoom;
    }

    async getAll() {
        await this.init();
        return await this.collection.find().toArray();
    }

    async update(room) {
        await this.init();
        const result = await this.collection.updateOne(
            { id: room.id },
            { $set: room }
        );

        if (result.modifiedCount === 0) {
            console.warn(`Room with id ${room.id} was not updated because it was not found.`);
            return false;
        }
        return true;
    }

    async delete(id) {
        await this.init();
        const result = await this.collection.deleteOne({ id: id });
        if (result.deletedCount === 0) {
            console.warn(`Room with id ${id} not found for deletion.`);
            return false;
        }
        return true;
    }
}

module.exports = { Room, RoomRepository };
