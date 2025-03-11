const { ObjectId } = require('mongodb');

class Images {

    constructor(db) {
        this.db = db;
    }

    async upload(file, userId) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const imagesCollection = conn.collection('images');

        const newImage = {
            userId: userId,
            file_name: file.originalname,
            file_content: file.buffer.toString('base64'),
            mime_type: file.mimetype,
            created_at: new Date()
        };

        const result = await imagesCollection.insertOne(newImage);

        return result.insertedId;
    }

    async get(id) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const imagesCollection = conn.collection('images');

        const result = await imagesCollection.findOne({ _id: ObjectId.createFromHexString(id) });

        if (!result) return null;

        return {
            file_name: result.file_name,
            file_content: Buffer.from(result.file_content, 'base64'),
            mime_type: result.mime_type
        };
    }

    async getImages(page, limit) {
        await this.db.connect()
        const conn = this.db.getConnection();

        const imagesCollection = conn.collection('images');

        
        const total = await imagesCollection.countDocuments();
        if (!total || total === 0) return { images: [], total };

        const result = await imagesCollection.find({})
        .sort({ created_at: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

        const objImages = result.map(image => ({
            id: image._id,
            user: image.userId,
            file_name: image.file_name,
            file_content: image.file_content.toString('base64'),
            mime_type: image.mime_type
        }));

        let respObj = {
            images: objImages,
            total: total
        }

        return respObj;
    }

    async getUserImages(page, limit, uid) {
        await this.db.connect()
        const conn = this.db.getConnection();
        const imagesCollection = conn.collection('images');
        const total = await imagesCollection.countDocuments({ userId: uid });
        if (!total || total === 0) return { images: [], total };

        const result = await imagesCollection.find({ userId: uid })
        .sort({ created_at: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();

        const objImages = result.map(image => ({
            id: image._id,
            user: image.userId,
            file_name: image.file_name,
            file_content: image.file_content.toString('base64'),
            mime_type: image.mime_type
        }));

        let respObj = {
            images: objImages,
            total: total
        }

        return respObj;
    }
}

module.exports = Images;
