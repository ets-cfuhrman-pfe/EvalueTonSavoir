const bcrypt = require("bcrypt");
const AppError = require("../middleware/AppError.js");
const { USER_ALREADY_EXISTS } = require("../constants/errorCodes");

class Users {
  
  constructor(db, foldersModel) {
      this.db = db;
      this.folders = foldersModel;
  }

  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  generatePassword() {
    return Math.random().toString(36).slice(-8);
  }

  async verify(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  async register(userInfos) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const existingUser = await userCollection.findOne({ email: userInfos.email });

    if (existingUser) {
      throw new AppError(USER_ALREADY_EXISTS);
    }

    let newUser = {
      name: userInfos.name ?? userInfos.email,
      email: userInfos.email,
      password: await this.hashPassword(userInfos.password),
      created_at: new Date(),
      roles: userInfos.roles
    };

    let created_user = await userCollection.insertOne(newUser);
    let user = await this.getById(created_user.insertedId)

    const folderTitle = "Dossier par défaut";
    
    const userId = newUser._id ? newUser._id.toString() : 'x';
    await this.folders.create(folderTitle, userId);

    // TODO: verif if inserted properly...
    return user;
  }

  async login(email, password) {
    console.log(`models/users: login: email: ${email}, password: ${password}`);
    try {
      await this.db.connect();
      const conn = this.db.getConnection();
      const userCollection = conn.collection("users");

      const user = await userCollection.findOne({ email: email });

      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404; 
        throw error;
      }

      const passwordMatch = await this.verify(password, user.password);

      if (!passwordMatch) {
        const error = new Error("Password does not match");
        error.statusCode = 401; 
        throw error;
      }
      console.log(`models/users: login: FOUND user: ${JSON.stringify(user)}`);
      return user;
    } catch (error) {
      console.error(error);
      throw error; 
    }
  }

  async resetPassword(email) {
    const newPassword = this.generatePassword();

    return await this.changePassword(email, newPassword);
  }

  async changePassword(email, newPassword) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const hashedPassword = await this.hashPassword(newPassword);

    const result = await userCollection.updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.modifiedCount != 1) return null;

    return newPassword;
  }

  async delete(email) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const result = await userCollection.deleteOne({ email });

    if (result.deletedCount != 1) return false;

    return true;
  }

  async getId(email) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const user = await userCollection.findOne({ email: email });

    if (!user) {
      return false;
    }

    return user._id;
  }

  async getById(id) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const user = await userCollection.findOne({ _id: id });

    if (!user) {
      return false;
    }

    return user;
  }

  async editUser(userInfo) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const userCollection = conn.collection("users");

    const user = await userCollection.findOne({ _id: userInfo.id });

    if (!user) {
      return false;
    }

    const updatedFields = { ...userInfo };
    delete updatedFields.id;

    const result = await userCollection.updateOne(
      { _id: userInfo.id },
      { $set: updatedFields }
    );

    if (result.modifiedCount === 1) {
      return true;
    }

    return false;
  }
}

module.exports = Users;
