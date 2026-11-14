//model
const ObjectId = require('mongodb').ObjectId;
const { generateUniqueTitle } = require('./utils');
const logger = require('../config/logger');

class Folders {
    constructor(db, quizModel) {
        this.db = db;
        this.quizModel = quizModel;
    }

    async create(title, userId) {

        if (!title || !userId) {
            throw new Error('Missing required parameter(s)');
        }
        
        await this.db.connect()
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        const existingFolder = await foldersCollection.findOne({ title: title, userId: userId });

        if (existingFolder) {
            throw new Error('Folder already exists');
        }

        const newFolder = {
            userId: userId,
            title: title,
            created_at: new Date()
        }

        const result = await foldersCollection.insertOne(newFolder);

        return result.insertedId;
    }

    async getUserFolders(userId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        const result = await foldersCollection.find({ userId: userId }).toArray();

        return result;
    }

    async getOwner(folderId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        const folder = await foldersCollection.findOne({ _id: ObjectId.createFromHexString(folderId) });

        return folder.userId;
    }

    // finds all quizzes in a folder
    async getContent(folderId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const filesCollection = conn.collection('files');

        const result = await filesCollection.find({ folderId: folderId }).toArray();

        return result;
    }

    async delete(folderId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        const folderResult = await foldersCollection.deleteOne({ _id: ObjectId.createFromHexString(folderId) });

        if (folderResult.deletedCount != 1) return false;
        await this.quizModel.deleteQuizzesByFolderId(folderId);

        return true;
    }

    async rename(folderId, userId, newTitle) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        // see if a folder exists for this user with the new title
        const existingFolder = await foldersCollection.findOne({ title: newTitle, userId: userId });

        if (existingFolder) throw new Error(`Folder with name '${newTitle}' already exists.`);

        const result = await foldersCollection.updateOne({ _id: ObjectId.createFromHexString(folderId), userId: userId }, { $set: { title: newTitle } })

        if (result.modifiedCount != 1) return false;

        return true
    }

    async duplicate(folderId, userId) {
        const conn = this.db.getConnection();
        const foldersCollection = conn.collection('folders');

        const sourceFolder = await foldersCollection.findOne({ _id: ObjectId.createFromHexString(folderId), userId: userId });
        if (!sourceFolder) {
            throw new Error(`Folder ${folderId} not found`);
        }

        const theUserId = userId;
        // Use the utility function to generate a unique title
        const newFolderTitle = await generateUniqueTitle(sourceFolder.title, async (title) => {
            // console.log(`generateUniqueTitle(${title}): userId`, theUserId);
            return await foldersCollection.findOne({ title: title, userId: theUserId });
        });

        const newFolderId = await this.create(newFolderTitle, userId);

        if (!newFolderId) {
            throw new Error('Failed to create duplicate folder');
        }

        // copy the quizzes from source folder to destination folder
        const content = await this.getContent(folderId);
        // console.log("folders.duplicate: found content", content);
        for (const quiz of content) {
            // console.log("folders.duplicate: creating quiz (copy)", quiz);
            const result = await this.quizModel.create(quiz.title, quiz.content, newFolderId.toString(), userId);
            if (!result) {
                throw new Error('Failed to create duplicate quiz');
            }
        }

        return newFolderId;
    }

    /**
     * Import a folder shared by another teacher: creates a new folder owned by
     * userId (with a unique title) and copies every quiz of the source folder into it.
     * Unlike duplicate(), the source folder may belong to any user.
     */
    async importShared(folderId, userId) {
        if (!folderId || !userId) {
            throw new Error('Missing required parameter(s)');
        }

        await this.db.connect();
        const conn = this.db.getConnection();
        const foldersCollection = conn.collection('folders');

        const sourceFolder = await foldersCollection.findOne({ _id: ObjectId.createFromHexString(folderId) });
        if (!sourceFolder) {
            throw new Error(`Folder ${folderId} not found`);
        }

        const titleTaken = async (title) => await foldersCollection.findOne({ title: title, userId: userId });
        // Keep the original title when the requester has no folder with that name
        const newFolderTitle = (await titleTaken(sourceFolder.title))
            ? await generateUniqueTitle(sourceFolder.title, titleTaken)
            : sourceFolder.title;

        // Read the source content before writing anything, so a read failure leaves no trace
        const content = await this.getContent(folderId);

        const newFolderId = await this.create(newFolderTitle, userId);
        if (!newFolderId) {
            throw new Error('Failed to create imported folder');
        }

        // MongoDB runs standalone (no replica set), so multi-document transactions are not
        // available: on any failure, undo what was written so the import is all-or-nothing.
        try {
            for (const quiz of content) {
                const result = await this.quizModel.create(quiz.title, quiz.content, newFolderId.toString(), userId);
                if (!result) {
                    throw new Error('Failed to import quiz');
                }
            }
        } catch (error) {
            await this.rollbackImport(newFolderId.toString());
            throw error;
        }

        return { folderId: newFolderId, title: newFolderTitle, quizCount: content.length };
    }

    /**
     * Removes a partially imported folder and the quizzes already copied into it.
     * Never throws: a cleanup failure is logged so the original import error is the one reported.
     */
    async rollbackImport(newFolderId) {
        try {
            await this.quizModel.deleteQuizzesByFolderId(newFolderId);
            const conn = this.db.getConnection();
            await conn.collection('folders').deleteOne({ _id: ObjectId.createFromHexString(newFolderId) });
        } catch (cleanupError) {
            logger.error('Failed to roll back partial folder import', {
                folderId: newFolderId,
                error: cleanupError.message,
                module: 'folder-model'
            });
        }
    }

    async folderExists(title, userId) {
        await this.db.connect();
        const conn = this.db.getConnection();
    
        const foldersCollection = conn.collection('folders');           
        const existingFolder = await foldersCollection.findOne({ title: title, userId: userId });
        return existingFolder ? true : false;
    }


    async copy(folderId, userId) {

        const sourceFolder = await this.getFolderWithContent(folderId);
        const newFolderId = await this.create(sourceFolder.title, userId);
        if (!newFolderId) {
            throw new Error('Failed to create a new folder.');
        }
        for (const quiz of sourceFolder.content) {
            await this.quizModel.create(quiz.title, quiz.content, newFolderId, userId);
        }

        return newFolderId;
    }

    async getFolderById(folderId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const foldersCollection = conn.collection('folders');

        const folder = await foldersCollection.findOne({ _id: ObjectId.createFromHexString(folderId) });

        if (!folder) return new Error(`Folder ${folderId} not found`);

        return folder;
    }


    async getFolderWithContent(folderId) {

       
        const folder = await this.getFolderById(folderId);

        const content = await this.getContent(folderId);
       
        return {
            ...folder,
            content: content
        };

    }

}

module.exports = Folders;
