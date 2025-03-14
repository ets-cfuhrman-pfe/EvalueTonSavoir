const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

class DBConnection {
    constructor() {
        // for testing with @shelf/jest-mongodb
        this.mongoURI = globalThis.__MONGO_URI__ || process.env.MONGO_URI;
        this.databaseName = globalThis.__MONGO_DB_NAME__ || process.env.MONGO_DATABASE;
        this.client = null;
        this.connection = null;
        console.log(`db.js: Mongo URI: ${this.mongoURI}`);
        console.log(`db.js: Mongo DB: ${this.databaseName}`);
    }

    // Return the current database connection, creating it if necessary
    async getConnection() {
        if (this.connection) {
            console.log('Using existing MongoDB connection');
            return this.connection;
        }

        try {
            // Create the MongoClient only if the connection does not exist
            this.client = new MongoClient(this.mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            await this.client.connect();
            this.connection = this.client.db(this.databaseName);
            console.log('MongoDB connected');
            return this.connection;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw new Error('Failed to connect to MongoDB');
        }
    }

    // Close the MongoDB connection gracefully
    async closeConnection() {
        if (this.client) {
            await this.client.close();
            this.connection = null;
            console.log('MongoDB connection closed');
        }
    }
}

// Exporting the singleton instance
const instance = new DBConnection();
module.exports = instance;
