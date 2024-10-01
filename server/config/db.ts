import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

class DBConnection {
    private mongoURI: string;
    private databaseName: string;
    private connection: MongoClient | null;

    constructor() {
        this.mongoURI = process.env.MONGO_URI || '';
        this.databaseName = process.env.MONGO_DATABASE || '';
        this.connection = null;
    }

    async connect(): Promise<void> {
        const client = new MongoClient(this.mongoURI);
        this.connection = await client.connect();
    }

    getConnection(): Db {
        if (!this.connection) {
            throw new Error('Connexion MongoDB non établie');
        }
        return this.connection.db(this.databaseName);
    }
}

export default new DBConnection();
