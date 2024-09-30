import db from '../config/db';
import { ObjectId } from 'mongodb';

export class Image {
    async upload(file: Express.Multer.File, userId: string): Promise<string> {
        await db.connect();
        const conn = db.getConnection();

        const imagesCollection = conn.collection('images');

        const newImage = {
            userId: userId,
            file_name: file.originalname,
            file_content: file.buffer.toString('base64'),
            mime_type: file.mimetype,
            created_at: new Date(),
        };

        const result = await imagesCollection.insertOne(newImage);

        return result.insertedId.toString();
    }

    async get(id: string): Promise<{ file_name: string; file_content: Buffer; mime_type: string } | null> {
        await db.connect();
        const conn = db.getConnection();

        const imagesCollection = conn.collection('images');

        const result = await imagesCollection.findOne({ _id: new ObjectId(id) });

        if (!result) return null;

        return {
            file_name: result.file_name,
            file_content: Buffer.from(result.file_content, 'base64'),
            mime_type: result.mime_type,
        };
    }
}

export default new Image();
