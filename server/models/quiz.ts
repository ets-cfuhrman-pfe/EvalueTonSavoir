import { ObjectId } from 'mongodb';
import { Folder } from './folder';
import { User } from './user';

export class Quiz {
    public created_at: Date;
    public updated_at: Date;

    constructor(public folder: Folder, public user: User, public title: string, public content: string, public _id?: ObjectId) {
        this.folder = folder;
        this.user = user;
        this.title = title;
        this.content = content;
        this.created_at = new Date();
        this.updated_at = new Date();
    }


    // async getOwner(quizId: string): Promise<string | null> {
    //     return await this.repository.getOwner(quizId);
    // }

    // async getContent(quizId: string): Promise<string | null> {
    //     return await this.repository.getContent(quizId);
    // }

    // async delete(quizId: string): Promise<boolean> {
    //     return await this.repository.delete(quizId);
    // }

    // async deleteQuizzes(folderId: string): Promise<number> {
    //     return await this.repository.deleteQuizzes(folderId);
    // }

    // async update(quizId: string, updateData: Partial<Quiz>): Promise<boolean> {
    //     return await this.repository.update(quizId, updateData);
    // }

    // async move(quizId: string, newFolderId: string): Promise<boolean> {
    //     return await this.repository.move(quizId, newFolderId);
    // }

    // async duplicate(quizId: string): Promise<ObjectId | null> {
    //     return await this.repository.duplicate(quizId);
    // }

    // async quizExists(title: string, userId: string): Promise<boolean> {
    //     return await this.repository.quizExists(title, userId);
    // }
}
