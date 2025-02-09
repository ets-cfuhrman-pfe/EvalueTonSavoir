const { ObjectId } = require('mongodb');
const { generateUniqueTitle } = require('./utils');

class Quiz {
    constructor(db) {
        this.db = db;
    }


    async create(title, content, folderId, userId, roomId) {
        await this.db.connect()
        const conn = this.db.getConnection();
        const quizCollection = conn.collection('files');

        const existingQuiz = await quizCollection.findOne({
            title: title,
            folderId: folderId,
            userId: userId
        });

        if (existingQuiz) {
            throw new Error(`Quiz already exists with title: ${title}, folderId: ${folderId}, userId: ${userId}`);
        }

        const newQuiz = {
            folderId: folderId,
            userId: userId,
            title: title,
            content: content,
            roomId: roomId,
            created_at: new Date(),
            updated_at: new Date()
        }

        const result = await quizCollection.insertOne(newQuiz);
        return result.insertedId;
    }

    async getOwner(quizId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: ObjectId.createFromHexString(quizId) });

        return quiz.userId;
    }

    async getContent(quizId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: ObjectId.createFromHexString(quizId) });

        return quiz;
    }

    async getRoomID(quizId) {
        await this.db.connect()
        const conn = this.db.getConnection();
        const quizCollection = conn.collection('files');
        const quiz = await quizCollection.findOne({ _id: ObjectId.createFromHexString(quizId) });
        return quiz.roomId;
    }

    async delete(quizId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.deleteOne({ _id: ObjectId.createFromHexString(quizId) });

        if (result.deletedCount != 1) return false;

        return true;
    }
    async deleteQuizzesByFolderId(folderId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const quizzesCollection = conn.collection('files');

        // Delete all quizzes with the specified folderId
        const result = await quizzesCollection.deleteMany({ folderId: folderId });
        return result.deletedCount > 0;
    }

    async update(quizId, newTitle, newContent) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.updateOne(
            { _id: ObjectId.createFromHexString(quizId) },
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

    async move(quizId, newFolderId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.updateOne(
            { _id: ObjectId.createFromHexString(quizId) },
            { $set: { folderId: newFolderId } }
        );

        if (result.modifiedCount != 1) return false;

        return true
    }

    async duplicate(quizId, userId) {
        const conn = this.db.getConnection();
        const quizCollection = conn.collection('files');

        const sourceQuiz = await quizCollection.findOne({ _id: ObjectId.createFromHexString(quizId), userId: userId });
        if (!sourceQuiz) {
            throw new Error('Quiz not found for quizId: ' + quizId);
        }

        // Use the utility function to generate a unique title
        const newQuizTitle = await generateUniqueTitle(sourceQuiz.title, async (title) => {
            return await quizCollection.findOne({ title: title, folderId: sourceQuiz.folderId, userId: userId });
        });

        const newQuizId = await this.create(newQuizTitle, sourceQuiz.content, sourceQuiz.folderId, userId);

        if (!newQuizId) {
            throw new Error('Failed to create duplicate quiz');
        }

        return newQuizId;
    }

    async quizExists(title, userId) {
        await this.db.connect();
        const conn = this.db.getConnection();

        const filesCollection = conn.collection('files');
        const existingFolder = await filesCollection.findOne({ title: title, userId: userId });

        return existingFolder !== null;
    }
}

module.exports = Quiz;