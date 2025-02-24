const ObjectId = require('mongodb').ObjectId;

class Rooms {
    constructor(db) {
        this.db = db;
    }

    async create(title, userId) {

        if (!title || !userId) {
            throw new Error('Missing required parameter(s)');
        }

        await this.db.connect()
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const normalizedTitle = title.toLowerCase();

        const existingRoom = await roomsCollection.findOne({ title: normalizedTitle, userId: userId });

        if (existingRoom) {
            throw new Error('Room already exists');
        }

        const newRoom = {
            userId: userId,
            title: title,
            created_at: new Date()
        }

        const result = await roomsCollection.insertOne(newRoom);

        return result.insertedId;
    }

    async getUserRooms(userId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const result = await roomsCollection.find({ userId: userId }).toArray();

        return result;
    }

    async getOwner(roomId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const room = await roomsCollection.findOne({ _id: ObjectId.createFromHexString(roomId) });

        return room.userId;
    }

    async getContent(roomId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const filesCollection = conn.collection('files');

        const result = await filesCollection.find({ roomId: roomId }).toArray();

        return result;
    }

    async delete(roomId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const roomResult = await roomsCollection.deleteOne({ _id: ObjectId.createFromHexString(roomId) });

        if (roomResult.deletedCount != 1) return false;

        return true;
    }

    async rename(roomId, userId, newTitle) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const existingRoom = await roomsCollection.findOne({ title: newTitle, userId: userId });

        if (existingRoom) throw new Error(`Room with name '${newTitle}' already exists.`);

        const result = await roomsCollection.updateOne({ _id: ObjectId.createFromHexString(roomId), userId: userId }, { $set: { title: newTitle } })

        if (result.modifiedCount != 1) return false;

        return true
    }

    async roomExists(title) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');
        const normalizedTitle = title.toLowerCase();
        const existingRoom = await roomsCollection.findOne({ title: normalizedTitle });
        return existingRoom ? true : false;
    }

    async getRoomById(roomId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const room = await roomsCollection.findOne({ _id: ObjectId.createFromHexString(roomId) });

        if (!room) return new Error(`Room ${roomId} not found`);

        return room;
    }


    async getRoomWithContent(roomId) {
        const room = await this.getRoomById(roomId);

        const content = await this.getContent(roomId);

        return {
            ...room,
            content: content
        };

    }
    async getRoomTitleByUserId(userId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const roomsCollection = conn.collection('rooms');

        const rooms = await roomsCollection.find({ userId: userId }).toArray();

        return rooms.map(room => room.title);
    }


}

module.exports = Rooms;