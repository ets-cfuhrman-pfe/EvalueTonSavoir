import { MongoClient } from 'mongodb';
import dotenv from 'dotenv'

dotenv.config();

export class DBConnection {

    mongoURI:string = process.env.MONGO_URI ?? "localhost:27017"
    databaseName:string = process.env.MONGO_DATABASE ?? "mangodb"
    connection:MongoClient | undefined = undefined;

    async connect() {
        const client = new MongoClient(this.mongoURI!);
        this.connection = await client.connect();
    }

    getConnection() {
        if (!this.connection) {
            throw new Error('Connexion MongoDB non établie');
        }
        return this.connection.db(this.databaseName);
    }
}

export default new DBConnection();