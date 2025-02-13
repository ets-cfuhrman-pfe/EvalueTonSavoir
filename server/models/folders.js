//model
const ObjectId = require('mongodb').ObjectId;
const { generateUniqueTitle } = require('./utils');

class Folders {
    constructor(db, questionnaireModel) {
        this.db = db;
        this.questionnaireModel = questionnaireModel;
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

    // finds all questionnaires in a folder
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
        await this.questionnaireModel.deleteQuestionnairesByFolderId(folderId);

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

        // copy the questionnaires from source folder to destination folder
        const content = await this.getContent(folderId);
        // console.log("folders.duplicate: found content", content);
        for (const questionnaire of content) {
            // console.log("folders.duplicate: creating questionnaire (copy)", questionnaire);
            const result = await this.questionnaireModel.create(questionnaire.title, questionnaire.content, newFolderId.toString(), userId);
            if (!result) {
                throw new Error('Failed to create duplicate questionnaire');
            }
        }

        return newFolderId;
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
        for (const questionnaire of sourceFolder.content) {
            await this.questionnaireModel.create(questionnaire.title, questionnaire.content, newFolderId, userId);
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
