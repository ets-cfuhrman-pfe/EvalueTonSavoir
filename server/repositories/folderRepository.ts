import { Db, ObjectId } from 'mongodb';
import DBConnection from '../config/db';
import { Folder } from '../models/folder';

class FolderRepository {
    private db: DBConnection;

    constructor() {
        this.db = new DBConnection();
    }

    async createFolder(folder: Folder): Promise<ObjectId | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const folderCollection = conn.collection('folders');

        const existingFolder = await folderCollection.findOne({ title: folder.title, userId: folder.userId });

        if (existingFolder) throw new Error('Dossier existe déjà.');

        const result = await folderCollection.insertOne(folder);
        return result.insertedId;
    }

    async getUserFolders(userId: string): Promise<any[]> {
        await db.connect();
        const conn = db.getConnection();

        const foldersCollection = conn.collection('folders');

        const result = await foldersCollection.find({ userId }).toArray();

        return result;
    }


    async getOwner(folderId: string): Promise<string | null> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const folderCollection = conn.collection('folders');

        const folder = await folderCollection.findOne({ _id: new ObjectId(folderId) });

        if (!folder) throw new Error('Dossier non trouvé.');

        return folder.userId;
    }

    async getContent(folderId: string): Promise<any[]> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const filesCollection = conn.collection('files');

        const result = await filesCollection.find({ folderId }).toArray();

        return result;
    }

    async delete(folderId: string): Promise<boolean> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const folderCollection = conn.collection('folders');

        // can't delete a folder if it has quizzes in it
        const filesCollection = conn.collection('files');
        const quizzes = await filesCollection.find({ folderId }).toArray();
        if (quizzes.length > 0) throw new Error('Dossier non vide.');

        const result = await folderCollection.deleteOne({ _id: new ObjectId(folderId) });

        return result.deletedCount === 1;
    }

    // async deleteQuizzes(folderId: string): Promise<number> {
    //     await this.db.connect();
    //     const conn: Db = this.db.getConnection();

    //     const quizCollection = conn.collection('files');

    //     const result = await quizCollection.deleteMany({ folderId: folderId });
    //     return result.deletedCount || 0;
    // }

    async rename(folderId: string, newTitle: string): Promise<boolean> {
        await this.db.connect();
        const conn: Db = this.db.getConnection();

        const folderCollection = conn.collection('folders');

        const result = await folderCollection.updateOne(
            { _id: new ObjectId(folderId) },
            { $set: { title: newTitle } }
        );

        return result.modifiedCount === 1;
    }

    async duplicate(folderId: string): Promise<ObjectId | null> {
        const sourceFolder = await this.getFolderWithContent(folderId);

        let newFolderTitle = `${sourceFolder.title}-copie`;
        let counter = 1;

        while (await sourceFolder.folderExists(newFolderTitle, sourceFolder.userId)) {
            newFolderTitle = `${sourceFolder.title}-copie(${counter})`;
            counter++;
        }

        const newFolderId = await this.createFolder(newFolderTitle);

        if (!newFolderId) {
            throw new Error('Failed to create a duplicate folder.');
        }

        for (const quiz of sourceFolder.content) {
            const { title, content } = quiz;
            await Quiz.create(title, content, newFolderId.toString(), userId);
        }

        return newFolderId;
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
