import { ObjectId } from 'mongodb';
import QuizRepository from '../repositories/quizRepository';

export class Quiz {
    private repository: QuizRepository;
    folderId: string;
    userId: string;
    title: string;
    content: string;
    created_at: Date;
    updated_at: Date;

    constructor(folderId: string, userId: string, title: string, content: string, repository?: QuizRepository) {
        this.repository = repository || new QuizRepository();
        this.folderId = folderId;
        this.userId = userId;
        this.title = title;
        this.content = content;
        this.created_at = new Date();
        this.updated_at = new Date();
    }

    async create(): Promise<ObjectId | null> {
        return await this.repository.createQuiz(this);
    }

    async getOwner(quizId: string): Promise<string | null> {
        return await this.repository.getOwner(quizId);
    }

    async getContent(quizId: string): Promise<string | null> {
        return await this.repository.getContent(quizId);
    }

    async delete(quizId: string): Promise<boolean> {
        return await this.repository.delete(quizId);
    }

    async deleteQuizzes(folderId: string): Promise<number> {
        return await this.repository.deleteQuizzes(folderId);
    }

    async update(quizId: string, updateData: Partial<Quiz>): Promise<boolean> {
        return await this.repository.update(quizId, updateData);
    }

    async move(quizId: string, newFolderId: string): Promise<boolean> {
        return await this.repository.move(quizId, newFolderId);
    }

    async duplicate(quizId: string): Promise<ObjectId | null> {
        return await this.repository.duplicate(quizId);
    }

    async quizExists(title: string, userId: string): Promise<boolean> {
        return await this.repository.quizExists(title, userId);
    }
}
