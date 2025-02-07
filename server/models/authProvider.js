const db = require('../config/db.js')
const { ObjectId } = require('mongodb');

class AuthProvider {
    constructor(name) {
      this._id = new ObjectId();
      this.name = name;
    }

    async getId(name){
      await db.connect()
      const conn = db.getConnection();

      const collection = conn.collection('authprovider');

      const existingauth = await collection.findOne({ name:name });

      if(existingauth){
        return existingauth._id
      }
      return null
    }

    async create(name) {
      await db.connect()
      const conn = db.getConnection();

      const collection = conn.collection('authprovider');

      const existingauth = await collection.findOne({ name:name });

      if(existingauth){
        return existingauth._id;
      }

      const newProvider = {
        name:name
      }
      const result = await collection.insertOne(newProvider);
      return result.insertedId;
  }
}

module.exports = new AuthProvider;