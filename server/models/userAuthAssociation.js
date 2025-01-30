const db = require('../config/db.js')
const { ObjectId } = require('mongodb');


class AuthUserAssoc {
    constructor(authProviderId, authId, userId) {
      this._id = new ObjectId();
      this.authProvider_id = authProviderId;
      this.auth_id = authId;
      this.user_id = userId;
    }
  }
  