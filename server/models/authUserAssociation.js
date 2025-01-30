const authProvider = require('./authProvider.js')
const db = require('../config/db.js')
const { ObjectId } = require('mongodb');


class AuthUserAssociation {
    constructor(authProviderId, authId, userId) {
      this._id = new ObjectId();
      this.authProvider_id = authProviderId;
      this.auth_id = authId;
      this.user_id = userId;
      this.connected = false;
    }

    async find_user_association(provider_name,auth_id){
      await db.connect()
      const conn = db.getConnection();

      const collection = conn.collection('authUserAssociation');
      const provider_id = await authProvider.getId(provider_name)

      const userAssociation = await collection.findOne({ authProvider_id: provider_id,auth_id,auth_id });
      return userAssociation
    }

    async link(provider_name,auth_id,user_id){
      await db.connect()
      const conn = db.getConnection();

      const collection = conn.collection('authUserAssociation');
      const provider_id = await authProvider.getId(provider_name)

      const userAssociation = await collection.findOne({ authProvider_id: provider_id, user_id: user_id });

      if(!userAssociation){
        return await collection.insertOne({
          _id:ObjectId,
          authProvider_id:provider_id,
          auth_id:auth_id,
          user_id:user_id,
        })
      }
    }

    async unlink(provider_name,user_id){
      await db.connect()
      const conn = db.getConnection();

      const collection = conn.collection('authUserAssociation');
      const provider_id = await authProvider.getId(provider_name)

      const userAssociation = await collection.findOne({ authProvider_id: provider_id, user_id: user_id });

      if(userAssociation){
        return await collection.deleteOne(userAssociation)
      } else return null
    }
  }
module.exports = new AuthUserAssociation;