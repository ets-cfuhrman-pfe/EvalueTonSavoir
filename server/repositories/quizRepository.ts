import { Db, ObjectId } from 'mongodb';
import DBConnection from '../config/db';
import { Quiz } from '../models/quiz';

class QuizRepository {
    private db: DBConnection;

    constructor() {
        this.db = new DBConnection();
    }

    async createQuiz(quiz: Quiz): Promise<ObjectId | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const existingQuiz = await quizCollection.findOne({ title: quiz.title, folderId: quiz.folderId, userId: quiz.userId });

        if (existingQuiz) return null;

        const result = await quizCollection.insertOne(quiz);
        return result.insertedId;
    }

    async getOwner(quizId: string): Promise<string | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: new ObjectId(quizId) });

        return quiz ? quiz.userId : null;
    }

    async getContent(quizId: string): Promise<string | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: new ObjectId(quizId) });

        return quiz ? quiz.content : null;
    }

    async delete(quizId: string): Promise<boolean> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.deleteOne({ _id: new ObjectId(quizId) });

        return result.deletedCount === 1;
    }

    async deleteQuizzes(folderId: string): Promise<number> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.deleteMany({ folderId: folderId });
        return result.deletedCount || 0;
    }

    async update(quizId: string, updateData: Partial<Quiz>): Promise<boolean> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const result = await quizCollection.updateOne(
            { _id: new ObjectId(quizId) },
            { $set: { ...updateData, updated_at: new Date() } }
        );

        return result.modifiedCount === 1;
    }

    async move(quizId: string, newFolderId: string): Promise<boolean> {
        return await this.update(quizId, { folderId: newFolderId });
    }

    async duplicate(quizId: string): Promise<ObjectId | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const quiz = await quizCollection.findOne({ _id: new ObjectId(quizId) });

        if (!quiz) return null;

        const newQuiz = {
            ...quiz,
            _id: undefined,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await quizCollection.insertOne(newQuiz);

        return result.insertedId;
    }

    async quizExists(title: string, userId: string): Promise<boolean> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const quizCollection = conn.collection('files');

        const existingQuiz = await quizCollection.findOne({ title: title, userId: userId });

        return existingQuiz !== null;
    }
}

export default QuizRepository;
