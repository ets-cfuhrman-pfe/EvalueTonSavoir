class Room {
    constructor(id, name, host, nbStudents = 0,) { // Default nbStudents to 0
        this.id = id;
        this.name = name;
        
        if (!host.startsWith('http://') && !host.startsWith('https://')) {
            host = 'http://' + host;
        }
        this.host = host;

        this.nbStudents = nbStudents;
        this.mustBeCleaned = false;
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
            throw new Error(`Érreur: la salle ${room.id} existe déja`);
        }
        const returnedId = await this.collection.insertOne(room);
        return await this.collection.findOne({ _id: returnedId.insertedId });
    }

    async get(id) {
        await this.init();
        const existingRoom = await this.collection.findOne({ id: id });
        if (!existingRoom) {
            console.warn(`La sale avec l'identifiant ${id} n'as pas été trouvé.`);
            return null;
        }
        return existingRoom;
    }

    async getAll() {
        await this.init();
        return await this.collection.find().toArray();
    }

    async update(room,roomId = null) {
        await this.init();
    
        const searchId = roomId ?? room.id;
        
        const result = await this.collection.updateOne(
            { id: searchId },
            { $set: room },
            { upsert: false }
        );
    
        if (result.modifiedCount === 0) {
            if (result.matchedCount > 0) {
                return true; // Document exists but no changes needed
            }
            return false;
        }
        return true;
    }

    async delete(id) {
        await this.init();
        const result = await this.collection.deleteOne({ id: id });
        if (result.deletedCount === 0) {
            console.warn(`La salle ${id} n'as pas été trouvée pour éffectuer sa suppression.`);	
            return false;
        }
        return true;
    }
}

module.exports = { Room, RoomRepository };
