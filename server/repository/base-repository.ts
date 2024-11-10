import { Collection, Document } from 'mongodb';
import type { DBConnection } from '../config/db-connection';

export default class BaseRepository<T extends Document>{
    protected db: DBConnection
    protected collection: Collection

    constructor(db:DBConnection,collectionName:string) {
        db= db;
        db.connect();
        this.collection = db.getConnection().collection(collectionName);
    }

    async create(item: T|Object): Promise<T | null> {
        const objectToInsert = item as T;
        if(!objectToInsert.validate()) return null;
        
        const result = await this.collection.insertOne(objectToInsert);
        return result.insertedId ? objectToInsert : null;
    }

    async getAll(): Promise<T[]> {
        const result = await this.collection.find().toArray();
        return result as Object[] as T[];
    }

    async get(id: string): Promise<T | null> {
        const result = await this.collection.findOne({ id: id });
        return result?._id ? result as object as T : null;
    }

    async update(id: string, item: T|Object): Promise<T | null> {
        const objectToInsert = item as T;
        if(!objectToInsert.validate()) return null;

        const result = await this.collection.updateOne({ id: id }, { $set: objectToInsert });
        return result.modifiedCount ? objectToInsert : null;
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.collection.deleteOne({ id: id });
        return result.deletedCount > 0;
    }
}