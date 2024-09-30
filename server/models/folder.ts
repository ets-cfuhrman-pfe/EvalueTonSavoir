import db from '../config/db';
import { ObjectId } from 'mongodb';
import { Quiz } from './quiz';
import { User } from './user';

export class Folder {
    private created_at: Date;

    constructor (public title: string, public user: User) {
        this.title = title;
        this.user = user;
        this.created_at = new Date();
    }

    // async create(title: string, userId: string): Promise<string> {
    //     // await db.connect();
    //     // const conn = db.getConnection();

    //     // const foldersCollection = conn.collection('folders');

    //     // const existingFolder = await foldersCollection.findOne({ title, userId });

    //     // if (existingFolder) throw new Error('Folder already exists');

    //     // const newFolder = {
    //     //     userId,
    //     //     title,
    //     //     created_at: new Date(),
    //     // };

    //     // const result = await foldersCollection.insertOne(newFolder);

    //     // return result.insertedId;
    // }

    // async getUserFolders(userId: string): Promise<any[]> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');

    //     const result = await foldersCollection.find({ userId }).toArray();

    //     return result;
    // }

    // async getOwner(folderId: string): Promise<string> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');

    //     const folder = await foldersCollection.findOne({ _id: new ObjectId(folderId) });

    //     return folder.userId;
    // }

    // async getContent(folderId: string): Promise<any[]> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const filesCollection = conn.collection('files');

    //     const result = await filesCollection.find({ folderId }).toArray();

    //     return result;
    // }

    // async delete(folderId: string): Promise<boolean> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');

    //     const folderResult = await foldersCollection.deleteOne({ _id: new ObjectId(folderId) });

    //     if (folderResult.deletedCount !== 1) return false;
    //     await Quiz.deleteQuizzesByFolderId(folderId);

    //     return true;
    // }

    // async rename(folderId: string, newTitle: string): Promise<boolean> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');

    //     const result = await foldersCollection.updateOne({ _id: new ObjectId(folderId) }, { $set: { title: newTitle } });

    //     if (result.modifiedCount !== 1) return false;

    //     return true;
    // }

    // async duplicate(folderId: string, userId: string): Promise<string> {
    //     const sourceFolder = await this.getFolderWithContent(folderId);

    //     let newFolderTitle = `${sourceFolder.title}-copie`;
    //     let counter = 1;

    //     while (await this.folderExists(newFolderTitle, userId)) {
    //         newFolderTitle = `${sourceFolder.title}-copie(${counter})`;
    //         counter++;
    //     }

    //     const newFolderId = await this.create(newFolderTitle, userId);

    //     if (!newFolderId) {
    //         throw new Error('Failed to create a duplicate folder.');
    //     }

    //     for (const quiz of sourceFolder.content) {
    //         const { title, content } = quiz;
    //         await Quiz.create(title, content, newFolderId.toString(), userId);
    //     }

    //     return newFolderId;
    // }

    // async folderExists(title: string, userId: string): Promise<boolean> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');
    //     const existingFolder = await foldersCollection.findOne({ title, userId });

    //     return existingFolder !== null;
    // }

    // async copy(folderId: string, userId: string): Promise<string> {
    //     const sourceFolder = await this.getFolderWithContent(folderId);
    //     const newFolderId = await this.create(sourceFolder.title, userId);

    //     if (!newFolderId) {
    //         throw new Error('Failed to create a new folder.');
    //     }

    //     for (const quiz of sourceFolder.content) {
    //         await this.createQuiz(quiz.title, quiz.content, newFolderId, userId);
    //     }

    //     return newFolderId;
    // }

    // async getFolderById(folderId: string): Promise<any> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const foldersCollection = conn.collection('folders');

    //     const folder = await foldersCollection.findOne({ _id: new ObjectId(folderId) });

    //     return folder;
    // }

    // async getFolderWithContent(folderId: string): Promise<any> {
    //     const folder = await this.getFolderById(folderId);
    //     const content = await this.getContent(folderId);

    //     return {
    //         ...folder,
    //         content,
    //     };
    // }
}
