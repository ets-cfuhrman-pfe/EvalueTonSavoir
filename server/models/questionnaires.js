const { ObjectId } = require('mongodb');
const { generateUniqueTitle } = require('./utils');

class Questionnaire {

    constructor(db) {
        // console.log("Questionnaire constructor: db", db)
        this.db = db;
    }

    async create(title, content, folderId, userId) {
        // console.log(`questionnaires: create title: ${title}, folderId: ${folderId}, userId: ${userId}`);
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const existingQuestionnaire = await questionnaireCollection.findOne({ title: title, folderId: folderId, userId: userId })

        if (existingQuestionnaire) {
            throw new Error(`Questionnaire already exists with title: ${title}, folderId: ${folderId}, userId: ${userId}`);
        }

        const newQuestionnaire = {
            folderId: folderId,
            userId: userId,
            title: title,
            content: content,
            created_at: new Date(),
            updated_at: new Date()
        }

        const result = await questionnaireCollection.insertOne(newQuestionnaire);
        // console.log("questionnaires: create insertOne result", result);

        return result.insertedId;
    }

    async getOwner(questionnaireId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const questionnaire = await questionnaireCollection.findOne({ _id: ObjectId.createFromHexString(questionnaireId) });

        return questionnaire.userId;
    }

    async getContent(questionnaireId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const questionnaire = await questionnaireCollection.findOne({ _id: ObjectId.createFromHexString(questionnaireId) });

        return questionnaire;
    }

    async delete(questionnaireId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const result = await questionnaireCollection.deleteOne({ _id: ObjectId.createFromHexString(questionnaireId) });

        if (result.deletedCount != 1) return false;

        return true;
    }
    async deleteQuestionnairesByFolderId(folderId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const questionnairesCollection = conn.collection('files');

        // Delete all questionnaires with the specified folderId
        const result = await questionnairesCollection.deleteMany({ folderId: folderId });
        return result.deletedCount > 0;
    }

    async update(questionnaireId, newTitle, newContent) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const result = await questionnaireCollection.updateOne(
            { _id: ObjectId.createFromHexString(questionnaireId) },
            { 
                $set: {
                    title: newTitle, 
                    content: newContent, 
                    updated_at: new Date() 
                } 
            }
        );

        return result.modifiedCount === 1;
    }

    async move(questionnaireId, newFolderId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const questionnaireCollection = conn.collection('files');

        const result = await questionnaireCollection.updateOne(
            { _id: ObjectId.createFromHexString(questionnaireId) }, 
            { $set: { folderId: newFolderId } }
        );

        if (result.modifiedCount != 1) return false;

        return true
    }

    async duplicate(questionnaireId, userId) {
        const conn = this.db.getConnection();
        const questionnaireCollection = conn.collection('files');

        const sourceQuestionnaire = await questionnaireCollection.findOne({ _id: ObjectId.createFromHexString(questionnaireId), userId: userId });
        if (!sourceQuestionnaire) {
            throw new Error('Questionnaire not found for questionnaireId: ' + questionnaireId);
        }

        // Use the utility function to generate a unique title
        const newQuestionnaireTitle = await generateUniqueTitle(sourceQuestionnaire.title, async (title) => {
            return await questionnaireCollection.findOne({ title: title, folderId: sourceQuestionnaire.folderId, userId: userId });
        });

        const newQuestionnaireId = await this.create(newQuestionnaireTitle, sourceQuestionnaire.content, sourceQuestionnaire.folderId, userId);

        if (!newQuestionnaireId) {
            throw new Error('Failed to create duplicate questionnaire');
        }

        return newQuestionnaireId;
    }

    async questionnaireExists(title, userId) {
        await this.db.connect();
        const conn = this.db.getConnection();
    
        const filesCollection = conn.collection('files');           
        const existingFolder = await filesCollection.findOne({ title: title, userId: userId });        
        
        return existingFolder !== null;
    }

}

module.exports = Questionnaire;
