const { ObjectId } = require('mongodb');

class Admin {

    constructor(db) {
        this.db = db;
    }

    async getUsers() {
        await this.db.connect()
        const conn = this.db.getConnection();

        const usrColl = conn.collection('users');

        const result = await usrColl.find({}).toArray();

        if (!result) return null;

        return result;
    }

    async deleteUser(id) {
        let deleted = false;
        await this.db.connect()
        const conn = this.db.getConnection();

        const usrColl = conn.collection('users');

        const result = await usrColl.deleteOne({ _id: ObjectId.createFromHexString(id) });

        if (result && result.deletedCount > 0) deleted = true;

        return deleted;
    }

    async getStats() {
        await this.db.connect()
        const conn = this.db.getConnection();
        const usrColl = conn.collection('users');
        const total = await usrColl.countDocuments();

        const quizColl = conn.collection('files');
        
        const result = await quizColl.aggregate([
            {
                $addFields: { userId: { $toObjectId: "$userId" } }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 1,
                    email: "$user.email",
                    title: 1,
                    created_at: 1,
                    updated_at: 1
                }
            }
        ]).toArray();

        let respObj = {
            quizzes: result,
            total: total
        }

        return respObj;
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

    async deleteImage(imgId) {
        let resp = false;
        await this.db.connect()
        const conn = this.db.getConnection();
        const quizColl = conn.collection('files');
        const rgxImg = new RegExp(`/api/image/get/${imgId}`);
        
        const result = await quizColl.find({ content: { $regex: rgxImg }}).toArray();
        if(!result || result.length < 1){
            const imgsColl = conn.collection('images');
            const isDeleted = await imgsColl.deleteOne({ _id: ObjectId.createFromHexString(imgId) });
            if(isDeleted){
                resp = true;
            }
        }
        return { deleted: resp };
    }
}

module.exports = Admin;
