const { ObjectId } = require('mongodb');
const { EJSON } = require('bson');

const AppError = require('../middleware/AppError');
const {
    MISSING_REQUIRED_PARAMETER,
    UNAUTHORIZED_ACCESS_DENIED
} = require('../constants/errorCodes');

const RESOURCE_CONFIG = {
    folders: { collection: 'folders' },
    quizzes: { collection: 'files' },
    images: { collection: 'images' },
    rooms: { collection: 'rooms' }
};

class AdminDataController {
    constructor(dbConnection) {
        this.db = dbConnection;
    }

    exportAllResources = async (req, res, next) => {
        try {
            this.ensureAdmin(req);

            const { userId } = req.params;

            if (!userId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = {};
            const resources = Object.keys(RESOURCE_CONFIG);

            for (const resource of resources) {
                const documents = await this.fetchDocuments(resource, userId);
                result[resource] = documents;
            }

            const safeTimestamp = new Date()
                .toISOString()
                .replaceAll(':', '-')
                .replaceAll('.', '-');
            const fileName = `all-data-${userId}-${safeTimestamp}.json`;
            const payload = EJSON.stringify(result, { relaxed: false, indent: 2 });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            if (req.logAction) {
                req.logAction('admin_export_all_user_data', {
                    requestedBy: req.user?.userId,
                    targetUserId: userId,
                    resource: 'all'
                });
            }

            return res.status(200).send(payload);
        } catch (error) {
            return next(error);
        }
    };

    ensureAdmin(req) {
        if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
            throw new AppError(UNAUTHORIZED_ACCESS_DENIED);
        }
    }

    async fetchDocuments(resource, userId) {
        await this.db.connect();
        const conn = this.db.getConnection();
        const collection = conn.collection(RESOURCE_CONFIG[resource].collection);
        const filter = this.buildUserFilter(userId);
        return collection.find(filter).toArray();
    }

    buildUserFilter(userId) {
        if (!ObjectId.isValid(userId)) {
            return { userId };
        }

        const objectId = ObjectId.createFromHexString(userId);
        return {
            $or: [
                { userId },
                { userId: objectId }
            ]
        };
    }
}

module.exports = AdminDataController;