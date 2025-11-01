const { MongoClient } = require('mongodb');
const envConfig = require('./environment');

class DBConnection {
    constructor() {
        this.mongoURI = envConfig.get('MONGO_URI');
        this.databaseName = envConfig.get('MONGO_DATABASE');
        this.client = null;
        this.connection = null;
    }

    // Connect to the database, but don't reconnect if already connected
    async connect() {
        if (this.connection) {
            return this.connection;
        }

        const logger = require('./logger');

        try {
            // If client was previously closed but we're trying to reconnect
            if (this.client && this.client.topology && this.client.topology.s.state === 'closed') {
                // Create a new client if the previous one was closed
                this.client = new MongoClient(this.mongoURI);
            } else if (!this.client) {
                // Create the MongoClient only if it doesn't exist
                this.client = new MongoClient(this.mongoURI);
            }
            
            const startTime = Date.now();
            await this.client.connect();
            const connectionTime = Date.now() - startTime;
            
            this.connection = this.client.db(this.databaseName);
            
            logger.info('MongoDB connected successfully', {
                database: this.databaseName,
                connectionTime: `${connectionTime}ms`
            });
            
            return this.connection;
        } catch (error) {
            logger.error('MongoDB connection failed', {
                error: error.message,
                stack: error.stack,
                database: this.databaseName
            });
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
            const logger = require('./logger');
            await this.client.close();
            this.connection = null;
            this.client = null;
            logger.info('MongoDB connection closed gracefully');
        }
    }
}

// Exporting the singleton instance
const instance = new DBConnection();
module.exports = instance;
