const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

class DBConnection {
    constructor() {
        this.mongoURI = process.env.MONGO_URI;
        this.databaseName = process.env.MONGO_DATABASE;
        this.client = null;
        this.connection = null;
    }

    // Connect to the database, but don't reconnect if already connected
    async connect() {
        if (this.connection) {
            console.log('Using existing MongoDB connection');
            return this.connection;
        }

        try {
            // If client was previously closed but we're trying to reconnect
            if (this.client && this.client.topology && this.client.topology.s.state === 'closed') {
                // Create a new client if the previous one was closed
                this.client = new MongoClient(this.mongoURI);
            } else if (!this.client) {
                // Create the MongoClient only if it doesn't exist
                this.client = new MongoClient(this.mongoURI);
            }
            
            await this.client.connect();
            this.connection = this.client.db(this.databaseName);
            console.log('MongoDB connected');
            return this.connection;
        } catch (error) {
            console.error('MongoDB connection error:', error);
            throw new Error('Failed to connect to MongoDB');
        }
    }

    // Return the current database connection
    getConnection() {
        if (!this.connection) {
            throw new Error('MongoDB connection not established');
        }
        return this.connection;
    }

    // Close the MongoDB connection gracefully
    async closeConnection() {
        if (this.client) {
            await this.client.close();
            this.connection = null;
            this.client = null;
            console.log('MongoDB connection closed');
        }
    }
}

// Exporting the singleton instance
const instance = new DBConnection();
module.exports = instance;
