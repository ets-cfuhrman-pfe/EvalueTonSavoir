import { Image } from './image';
import { Quiz } from './quiz';
import { Folder } from './folder';

export interface UserOptions {
    email: string;
    hashedPassword: string;
    created_at?: Date;
    _id?: string;
    folders?: Array<Folder>;
    images?: Array<Image>;
    quizzes?: Array<Quiz>;
}

export class User {
    email: string;
    hashedPassword: string;
    created_at?: Date;
    _id?: string;
    folders?: Array<Folder>;
    images?: Array<Image>;
    quizzes?: Array<Quiz>;

    constructor(options: UserOptions) {
        this.email = options.email;
        this.hashedPassword = options.hashedPassword;
        this.created_at = options.created_at || new Date();
        this._id = options._id;
        this.folders = options.folders || [];
        this.images = options.images || [];
        this.quizzes = options.quizzes || [];
    }

    // async hashPassword(password: string): Promise<string> {
    //     return await bcrypt.hash(password, 10);
    // }

    // generatePassword(): string {
    //     return Math.random().toString(36).slice(-8);
    // }

    // async verify(password: string, hash: string): Promise<boolean> {
    //     return await bcrypt.compare(password, hash);
    // }

    // async register(email: string, password: string): Promise<void> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const userCollection = conn.collection('users');

    //     const existingUser = await userCollection.findOne({ email });

    //     if (existingUser) {
    //         throw new AppError(USER_ALREADY_EXISTS);
    //     }

    //     const newUser = {
    //         email,
    //         password: await this.hashPassword(password),
    //         created_at: new Date(),
    //     };

    //     await userCollection.insertOne(newUser);

    //     const folderTitle = 'Dossier par Défaut';
    //     const userId = newUser._id.toString();
    //     await Folders.create(folderTitle, userId);

    //     // TODO: verif if inserted properly...
    // }

    // async login(email: string, password: string): Promise<any> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const userCollection = conn.collection('users');

    //     const user = await userCollection.findOne({ email });

    //     if (!user) {
    //         return false;
    //     }

    //     const passwordMatch = await this.verify(password, user.password);

    //     if (!passwordMatch) {
    //         return false;
    //     }

    //     return user;
    // }

    // async resetPassword(email: string): Promise<string> {
    //     const newPassword = this.generatePassword();

    //     return await this.changePassword(email, newPassword);
    // }

    // async changePassword(email: string, newPassword: string): Promise<string | null> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const userCollection = conn.collection('users');

    //     const hashedPassword = await this.hashPassword(newPassword);

    //     const result = await userCollection.updateOne({ email }, { $set: { password: hashedPassword } });

    //     if (result.modifiedCount !== 1) return null;

    //     return newPassword;
    // }

    // async delete(email: string): Promise<boolean> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const userCollection = conn.collection('users');

    //     const result = await userCollection.deleteOne({ email });

    //     if (result.deletedCount !== 1) return false;

    //     return true;
    // }

    // async getId(email: string): Promise<string | false> {
    //     await db.connect();
    //     const conn = db.getConnection();

    //     const userCollection = conn.collection('users');

    //     const user = await userCollection.findOne({ email });

    //     if (!user) {
    //         return false;
    //     }

    //     return user._id;
    // }
}

