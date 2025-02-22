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

    //TODO TEST
    async getAll() {
        await this.db.connect()
        const conn = this.db.getConnection();

        const imagesCollection = conn.collection('images');

        const result = await imagesCollection.find({});

        if (!result) return null;

        //TODO latency issues -> images > 20 
        // USE pagination
        /*
            app.get('/images', (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const images = getImagesFromDatabase(page, limit);
            res.json(images);
            });
        */
        const imagesName = result.map(image => ({
            id: image.id,
            file_name: image.file_name,
            file_content: Buffer.from(image.file_content, 'base64'),
            mime_type: image.mime_type
        }));

        return imagesName;
    }

}

module.exports = Images;
