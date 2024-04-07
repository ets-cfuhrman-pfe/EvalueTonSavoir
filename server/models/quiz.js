const db = require('../config/db.js')
const { ObjectId } = require('mongodb');

class Quiz {

    async create(title, content, folderId, userId) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const existingQuiz = await quizCollection.findOne({ title: title, folderId: folderId, userId: userId })

        if (existingQuiz) return null;

        const newQuiz = {
            folderId: folderId,
            userId: userId,
            title: title,
            content: content,
            created_at: new Date(),
            updated_at: new Date()
        }

        const result = await quizCollection.insertOne(newQuiz);

        return result.insertedId;
    }

    async getOwner(quizId) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: new ObjectId(quizId) });

        return quiz.userId;
    }

    async getContent(quizId) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: new ObjectId(quizId) });

        return quiz;
    }

    async delete(quizId) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.deleteOne({ _id: new ObjectId(quizId) });

        if (result.deletedCount != 1) return false;

        return true;
    }
    async deleteQuizzesByFolderId(folderId) {
        await db.connect();
        const conn = db.getConnection();

        const quizzesCollection = conn.collection('files');

        // Delete all quizzes with the specified folderId
        await quizzesCollection.deleteMany({ folderId: folderId });
    }

    async update(quizId, newTitle, newContent) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.updateOne({ _id: new ObjectId(quizId) }, { $set: { title: newTitle, content: newContent } });
        //Ne fonctionne pas si rien n'est chngé dans le quiz 
        //if (result.modifiedCount != 1) return false;

        return true
    }

    async move(quizId, newFolderId) {
        await db.connect()
        const conn = db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.updateOne({ _id: new ObjectId(quizId) }, { $set: { folderId: newFolderId } });

        if (result.modifiedCount != 1) return false;

        return true
    }

    async duplicate(quizId, userId) {
        
        const sourceQuiz = await this.getContent(quizId);
        
        let newQuizTitle = `${sourceQuiz.title}-copy`;
        let counter = 1;        
        while (await this.quizExists(newQuizTitle, userId)) {
            newQuizTitle = `${sourceQuiz.title}-copy(${counter})`;
            counter++;
        }
        //console.log(newQuizTitle);
        const newQuizId = await this.create(newQuizTitle, sourceQuiz.content,sourceQuiz.folderId, userId);

        if (!newQuizId) {
            throw new Error('Failed to create a duplicate quiz.');
        }

        return newQuizId;

    }

    async quizExists(title, userId) {
        await db.connect();
        const conn = db.getConnection();
    
        const filesCollection = conn.collection('files');           
        const existingFolder = await filesCollection.findOne({ title: title, userId: userId });        
        
        return existingFolder !== null;
    }

}

module.exports = new Quiz;