//user
const bcrypt = require('bcrypt');
const AppError = require('../middleware/AppError.js');
const { USER_ALREADY_EXISTS } = require('../constants/errorCodes');
const Folders = require('../models/folders.js');

class Users {
    constructor(db) {
        console.log("Users constructor: db", db)
        this.db = db;
    }
    
    async hashPassword(password) {
        return await bcrypt.hash(password, 10)
    }

    generatePassword() {
        return Math.random().toString(36).slice(-8);
    }

    async verify(password, hash) {
        return await bcrypt.compare(password, hash)
    }

    async register(email, password) {
        await this.db.connect()
        const conn = this.db.getConnection();
        
        const userCollection = conn.collection('users');

        const existingUser = await userCollection.findOne({ email: email });

        if (existingUser) {
            throw new AppError(USER_ALREADY_EXISTS);
        }

        const newUser = {
            email: email,
            password: await this.hashPassword(password),
            created_at: new Date()
        };

        const result = await userCollection.insertOne(newUser);
        console.log("userCollection.insertOne() result", result);
        const userId = result.insertedId.toString();

        const folderTitle = 'Dossier par Défaut'; 
        await Folders.create(folderTitle, userId);

        return result;
    }

    async login(email, password) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const userCollection = conn.collection('users');

        const user = await userCollection.findOne({ email: email });

        if (!user) {
            return false;
        }

        const passwordMatch = await this.verify(password, user.password);

        if (!passwordMatch) {
            return false;
        }

        return user;
    }

    async resetPassword(email) {
        const newPassword = this.generatePassword();

        return await this.changePassword(email, newPassword);
    }

    async changePassword(email, newPassword) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const userCollection = conn.collection('users');

        const hashedPassword = await this.hashPassword(newPassword);

        const result = await userCollection.updateOne({ email }, { $set: { password: hashedPassword } });

        if (result.modifiedCount != 1) return null;

        return newPassword
    }

    async delete(email) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const userCollection = conn.collection('users');

        const result = await userCollection.deleteOne({ email });

        if (result.deletedCount != 1) return false;

        return true;
    }

    async getId(email) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const userCollection = conn.collection('users');

        const user = await userCollection.findOne({ email: email });

        if (!user) {
            return false;
        }

        return user._id;
    }

}

module.exports = Users;
