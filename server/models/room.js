
class Room {
    constructor(id,name,host,nbStudents){
        this.id = id;
        this.name = name;
        this.host = host;
        this.nbStudents = nbStudents;
    }
}

class RoomRepository{
    constructor(db) {
        this.db = db;
        this.connection = null;
        this.collection = null;
    }

    async init(){
        if(!this.connection){
            await this.db.connect()
            this.connection = this.db.getConnection();
        }
        if(!this.collection) this.collection = this.connection.collection('rooms');
    }

    async create(room){
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
        return existingRoom
    }

    async getAll() {
        await this.init();
        const result = await this.collection.find().toArray();
        return result;
    }
    
    async update(room){
        await this.init();
        const result = await this.collection.updateOne(
            { id: room.id },
            { 
                $set: room
            }
        );

        return result.modifiedCount === 1;
    }

    async delete(id){
        await this.init();
        const result = await this.collection.deleteMany({ id: id });
        return result.deletedCount > 0;
    }
}

module.exports = {Room, RoomRepository};

