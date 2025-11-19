const { ObjectId } = require('mongodb');
const { EJSON } = require('bson');

const AppError = require('../middleware/AppError');
const {
    MISSING_REQUIRED_PARAMETER,
    UNAUTHORIZED_ACCESS_DENIED,
    VALIDATION_ERROR
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

    exportResource = async (req, res, next) => {
        try {
            this.ensureAdmin(req);

            const { userId, resource } = req.params;

            if (!userId || !resource) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const normalizedResource = this.normalizeResource(resource);
            const documents = await this.fetchDocuments(normalizedResource, userId);

            const safeTimestamp = new Date()
                .toISOString()
                .replaceAll(':', '-')
                .replaceAll('.', '-');
            const fileName = `${normalizedResource}-${userId}-${safeTimestamp}.json`;
            const payload = EJSON.stringify(documents, { relaxed: false, indent: 2 });

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

            if (req.logAction) {
                req.logAction('admin_export_user_data', {
                    requestedBy: req.user?.userId,
                    targetUserId: userId,
                    resource: normalizedResource,
                    documentCount: documents.length
                });
            }

            return res.status(200).send(payload);
        } catch (error) {
            return next(error);
        }
    };

    importResource = async (req, res, next) => {
        try {
            this.ensureAdmin(req);

            const { userId, resource } = req.params;
            const mode = (req.query?.mode || 'append').toLowerCase();

            if (!userId || !resource) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            if (!['replace', 'append'].includes(mode)) {
                throw new AppError(VALIDATION_ERROR('Le mode doit être "replace" ou "append".'));
            }

            if (!req.file) {
                throw new AppError(VALIDATION_ERROR('Aucun fichier fourni.'));
            }

            const normalizedResource = this.normalizeResource(resource);
            const rawContent = req.file.buffer.toString('utf-8');

            const parsed = EJSON.parse(rawContent, { relaxed: false });

            if (!Array.isArray(parsed)) {
                throw new AppError(VALIDATION_ERROR('Le fichier doit contenir un tableau JSON.'));
            }

            const sanitizedDocs = parsed.map((doc) => this.sanitizeDocument(normalizedResource, doc, userId));

            const result = await this.persistDocuments(normalizedResource, sanitizedDocs, userId, mode);

            if (req.logAction) {
                req.logAction('admin_import_user_data', {
                    requestedBy: req.user?.userId,
                    targetUserId: userId,
                    resource: normalizedResource,
                    documentCount: sanitizedDocs.length,
                    mode,
                    stats: result
                });
            }

            return res.status(200).json({
                ...result,
                mode
            });
        } catch (error) {
            if (!(error instanceof AppError) && this.isEjsonParseError(error)) {
                return next(new AppError(VALIDATION_ERROR('Le fichier ne contient pas un JSON valide.')));
            }
            return next(error);
        }
    };

    ensureAdmin(req) {
        if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
            throw new AppError(UNAUTHORIZED_ACCESS_DENIED);
        }
    }

    normalizeResource(resource) {
        const key = resource?.toLowerCase();
        if (!RESOURCE_CONFIG[key]) {
            throw new AppError(VALIDATION_ERROR('Type de ressource non supporté.'));
        }
        return key;
    }

    async fetchDocuments(resource, userId) {
        await this.db.connect();
        const conn = this.db.getConnection();
        const collection = conn.collection(RESOURCE_CONFIG[resource].collection);
        const filter = this.buildUserFilter(userId);
        return collection.find(filter).toArray();
    }

    async persistDocuments(resource, documents, userId, mode) {
        await this.db.connect();
        const conn = this.db.getConnection();
        const collection = conn.collection(RESOURCE_CONFIG[resource].collection);

        let removed = 0;
        if (mode === 'replace') {
            const deleteResult = await collection.deleteMany(this.buildUserFilter(userId));
            removed = deleteResult.deletedCount || 0;
        }

        if (documents.length === 0) {
            return { inserted: 0, updated: 0, removed };
        }

        const operations = documents.map((doc) => ({
            replaceOne: {
                filter: { _id: doc._id },
                replacement: doc,
                upsert: true
            }
        }));

        const writeResult = await collection.bulkWrite(operations, { ordered: false });

        return {
            inserted: writeResult.upsertedCount || 0,
            updated: writeResult.modifiedCount || 0,
            removed
        };
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

    sanitizeDocument(resource, document, userId) {
        const clone = { ...document };

        clone._id = this.coerceObjectId(clone._id);
        clone.userId = userId;
        clone.created_at = this.coerceDate(clone.created_at);
        if (resource !== 'images') {
            clone.updated_at = this.coerceDate(clone.updated_at || clone.created_at);
        }

        if (resource === 'quizzes') {
            clone.folderId = this.coerceIdToString(clone.folderId);
        }

        if (resource === 'images') {
            clone.file_content = this.ensureBase64(clone.file_content);
            clone.mime_type = clone.mime_type || 'application/octet-stream';
            clone.file_name = clone.file_name || 'image';
        }

        if (resource === 'folders') {
            clone.title = clone.title || 'Sans titre';
        }

        if (resource === 'rooms') {
            clone.title = clone.title || 'Salle';
        }

        delete clone.id;

        return clone;
    }

    coerceObjectId(value) {
        if (!value) {
            return new ObjectId();
        }
        if (value instanceof ObjectId) {
            return value;
        }
        if (typeof value === 'string' && ObjectId.isValid(value)) {
            return ObjectId.createFromHexString(value);
        }
        return new ObjectId();
    }

    coerceIdToString(value) {
        if (!value) {
            return undefined;
        }
        if (value instanceof ObjectId) {
            return value.toHexString();
        }
        return String(value);
    }

    coerceDate(value) {
        if (!value) {
            return new Date();
        }
        if (value instanceof Date) {
            return value;
        }
        const coerced = new Date(value);
        return Number.isNaN(coerced.getTime()) ? new Date() : coerced;
    }

    ensureBase64(value) {
        if (!value) {
            return '';
        }
        if (typeof value === 'string') {
            return value;
        }
        if (value instanceof Buffer) {
            return value.toString('base64');
        }
        return Buffer.from(String(value)).toString('base64');
    }

    isEjsonParseError(error) {
        if (!error) {
            return false;
        }
        const parseErrorNames = new Set(['BSONError', 'BSONTypeError', 'SyntaxError']);
        if (parseErrorNames.has(error.name)) {
            return true;
        }
        const message = String(error.message || '').toLowerCase();
        return message.includes('ejson') || message.includes('unexpected token');
    }
}

module.exports = AdminDataController;