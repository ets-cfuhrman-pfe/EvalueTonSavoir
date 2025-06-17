class MockDBConnection {
    constructor() {
        this.db = jest.fn().mockReturnThis();
        this.collection = jest.fn().mockReturnThis();
        this.insertOne = jest.fn();
        this.findOne = jest.fn();
        this.updateOne = jest.fn();
        this.deleteOne = jest.fn();
    }

    async connect() {
        // Simulate successful connection
    }

    getConnection() {
        return this;
    }
}

module.exports = MockDBConnection;
