const { ObjectId } = require('mongodb');
const { generateUniqueTitle } = require('./utils');
const logger = require('../config/logger');

class Quiz {

    constructor(db) {
        // console.log("Quiz constructor: db", db)
        this.db = db;
    }

    async create(title, content, folderId, userId) {
        const startTime = Date.now();
        logger.debug('Quiz creation initiated', {
            title: title,
            folderId: folderId,
            userId: userId,
            contentLength: content.length,
            module: 'quiz-model'
        });

        try {
            await this.db.connect();
            const conn = this.db.getConnection();
            const quizCollection = conn.collection('files');

            const checkStartTime = Date.now();
            const existingQuiz = await quizCollection.findOne({ title: title, folderId: folderId, userId: userId });
            const checkTime = Date.now() - checkStartTime;

            if (existingQuiz) {
                logger.warn('Quiz creation failed: quiz already exists', {
                    title: title,
                    folderId: folderId,
                    userId: userId,
                    existingQuizId: existingQuiz._id,
                    checkTime: `${checkTime}ms`,
                    module: 'quiz-model'
                });
                throw new Error(`Quiz already exists with title: ${title}, folderId: ${folderId}, userId: ${userId}`);
            }

            const newQuiz = {
                folderId: folderId,
                userId: userId,
                title: title,
                content: content,
                created_at: new Date(),
                updated_at: new Date()
            };

            const insertStartTime = Date.now();
            const result = await quizCollection.insertOne(newQuiz);
            const insertTime = Date.now() - insertStartTime;
            const totalTime = Date.now() - startTime;

            logger.info('Quiz creation completed successfully', {
                quizId: result.insertedId,
                title: title,
                folderId: folderId,
                userId: userId,
                contentLength: content.length,
                contentHash: require('crypto').createHash('md5').update(Array.isArray(content) ? content.join('\n\n') : String(content)).digest('hex'),
                totalTime: `${totalTime}ms`,
                checkTime: `${checkTime}ms`,
                insertTime: `${insertTime}ms`,
                module: 'quiz-model'
            });

            return result.insertedId;
        } catch (error) {
            const totalTime = Date.now() - startTime;
            logger.error('Quiz creation failed', {
                title: title,
                folderId: folderId,
                userId: userId,
                error: error.message,
                totalTime: `${totalTime}ms`,
                module: 'quiz-model'
            });
            throw error;
        }
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
