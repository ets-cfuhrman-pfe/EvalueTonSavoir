const bcrypt = require("bcrypt");
const AppError = require("../middleware/AppError.js");
const { USER_ALREADY_EXISTS } = require("../constants/errorCodes");
const logger = require("../config/logger");

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
    const startTime = Date.now();
    logger.debug('User registration initiated', {
      email: userInfos.email,
      hasName: !!userInfos.name,
      hasRoles: !!userInfos.roles,
      module: 'users-model'
    });

    try {
      await this.db.connect();
      const conn = this.db.getConnection();
      const userCollection = conn.collection("users");

      const checkStartTime = Date.now();
      const existingUser = await userCollection.findOne({ email: userInfos.email });
      const checkTime = Date.now() - checkStartTime;

      if (existingUser) {
        logger.warn('User registration failed: user already exists', {
          email: userInfos.email,
          checkTime: `${checkTime}ms`,
          module: 'users-model'
        });
        throw new AppError(USER_ALREADY_EXISTS);
      }

      logger.debug('User existence check passed', {
        email: userInfos.email,
        checkTime: `${checkTime}ms`,
        module: 'users-model'
      });

      const hashStartTime = Date.now();
      const hashedPassword = await this.hashPassword(userInfos.password);
      const hashTime = Date.now() - hashStartTime;

      let newUser = {
        name: userInfos.name ?? userInfos.email,
        email: userInfos.email,
        password: hashedPassword,
        created_at: new Date(),
        roles: userInfos.roles
      };

      const insertStartTime = Date.now();
      let created_user = await userCollection.insertOne(newUser);
      const insertTime = Date.now() - insertStartTime;

      let user = await this.getById(created_user.insertedId);
      const folderTitle = "Dossier par Défaut";
      
      const userId = created_user.insertedId.toString();
      
      const folderStartTime = Date.now();
      await this.folders.create(folderTitle, userId);
      const folderTime = Date.now() - folderStartTime;
      const totalTime = Date.now() - startTime;

      logger.info('User registration completed successfully', {
        userId: created_user.insertedId,
        email: userInfos.email,
        totalTime: `${totalTime}ms`,
        checkTime: `${checkTime}ms`,
        hashTime: `${hashTime}ms`,
        insertTime: `${insertTime}ms`,
        folderTime: `${folderTime}ms`,
        module: 'users-model'
      });

      return user;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('User registration failed', {
        email: userInfos.email,
        error: error.message,
        totalTime: `${totalTime}ms`,
        module: 'users-model'
      });
      throw error;
    }
  }

  async login(email, password) {
    logger.debug('User login attempt', {
      email: email,
      hasPassword: !!password
    });
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
      logger.info('User login successful', {
        userId: user._id,
        email: user.email
      });
      return user;
    } catch (error) {
      logger.error('User login failed', {
        email: email,
        error: error.message,
        stack: error.stack
      });
      throw error; 
    }
  }

  async resetPassword(email) {
    const newPassword = this.generatePassword();

    return await this.changePassword(email, newPassword);
  }

  async changePassword(email, newPassword) {
    const startTime = Date.now();
    logger.debug('Password change initiated', {
      email: email,
      module: 'users-model'
    });

    try {
      await this.db.connect();
      const conn = this.db.getConnection();
      const userCollection = conn.collection("users");

      const hashStartTime = Date.now();
      const hashedPassword = await this.hashPassword(newPassword);
      const hashTime = Date.now() - hashStartTime;

      const updateStartTime = Date.now();
      const result = await userCollection.updateOne(
        { email },
        { $set: { password: hashedPassword, updated_at: new Date() } }
      );
      const updateTime = Date.now() - updateStartTime;
      const totalTime = Date.now() - startTime;

      if (result.modifiedCount != 1) {
        logger.warn('Password change failed: no user modified', {
          email: email,
          matchedCount: result.matchedCount,
          modifiedCount: result.modifiedCount,
          totalTime: `${totalTime}ms`,
          module: 'users-model'
        });
        return null;
      }

      logger.info('Password change completed successfully', {
        email: email,
        totalTime: `${totalTime}ms`,
        hashTime: `${hashTime}ms`,
        updateTime: `${updateTime}ms`,
        module: 'users-model'
      });

      return newPassword;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('Password change failed', {
        email: email,
        error: error.message,
        totalTime: `${totalTime}ms`,
        module: 'users-model'
      });
      throw error;
    }
  }

  async delete(email) {
    const startTime = Date.now();
    logger.warn('User deletion initiated', {
      email: email,
      module: 'users-model'
    });

    try {
      await this.db.connect();
      const conn = this.db.getConnection();
      const userCollection = conn.collection("users");

      // Get user details before deletion for audit trail
      const getUserStartTime = Date.now();
      const user = await userCollection.findOne({ email: email });
      const getUserTime = Date.now() - getUserStartTime;

      if (!user) {
        logger.warn('User deletion failed: user not found', {
          email: email,
          getUserTime: `${getUserTime}ms`,
          totalTime: `${Date.now() - startTime}ms`,
          module: 'users-model'
        });
        return false;
      }

      const deleteStartTime = Date.now();
      const result = await userCollection.deleteOne({ email });
      const deleteTime = Date.now() - deleteStartTime;
      const totalTime = Date.now() - startTime;

      if (result.deletedCount != 1) {
        logger.error('User deletion failed: no user deleted', {
          email: email,
          userId: user._id,
          deletedCount: result.deletedCount,
          totalTime: `${totalTime}ms`,
          module: 'users-model'
        });
        return false;
      }

      logger.warn('User deletion completed successfully', {
        deletedUserId: user._id,
        deletedEmail: email,
        userCreatedAt: user.created_at,
        totalTime: `${totalTime}ms`,
        getUserTime: `${getUserTime}ms`,
        deleteTime: `${deleteTime}ms`,
        module: 'users-model'
      });

      return true;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error('User deletion error', {
        email: email,
        error: error.message,
        totalTime: `${totalTime}ms`,
        module: 'users-model'
      });
      throw error;
    }
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
