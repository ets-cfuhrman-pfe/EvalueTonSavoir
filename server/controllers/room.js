const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, ROOM_NOT_FOUND, ROOM_ALREADY_EXISTS, GETTING_ROOM_ERROR, DELETE_ROOM_ERROR, UPDATE_ROOM_ERROR } = require('../constants/errorCodes');

class RoomsController {

    constructor(roomsModel) {
        this.rooms = roomsModel;
        this.getRoomTitle = this.getRoomTitle.bind(this);
    }

   // In RoomsController.js
create = async (req, res, next) => {
    try {
        const { title } = req.body;

        if (!title) {
            throw new AppError(MISSING_REQUIRED_PARAMETER);
        }

        const result = await this.rooms.create(title, req.user.userId);

        if (!result) {
            throw new AppError(ROOM_ALREADY_EXISTS);
        }

        return res.status(200).json({
            message: 'Room cree avec succes.',
            roomId: result.insertedId // Ensure result contains the insertedId
        });

    } catch (error) {
        return next(error);
    }
}

    getUserRooms = async (req, res, next) => {
        try {
            const rooms = await this.rooms.getUserRooms(req.user.userId);

            if (!rooms) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            return res.status(200).json({
                data: rooms
            });

        } catch (error) {
            return next(error);
        }
    }

    getRoomContent = async (req, res, next) => {
        try {
            const { roomId } = req.params;

            if (!roomId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const owner = await this.rooms.getOwner(roomId);

            if (owner != req.user.userId) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            const content = await this.rooms.getContent(roomId);

            if (!content) {
                throw new AppError(GETTING_ROOM_ERROR);
            }

            return res.status(200).json({
                data: content
            });

        } catch (error) {
            return next(error);
        }
    }

    delete = async (req, res, next) => {
        try {
            const { roomId } = req.params;

            if (!roomId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const owner = await this.rooms.getOwner(roomId);

            if (owner != req.user.userId) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            const result = await this.rooms.delete(roomId);

            if (!result) {
                throw new AppError(DELETE_ROOM_ERROR);
            }

            return res.status(200).json({
                message: 'Salle supprim� avec succ�s.'
            });

        } catch (error) {
            return next(error);
        }
    }

    rename = async (req, res, next) => {
        try {
            const { roomId, newTitle } = req.body;

            if (!roomId || !newTitle) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const owner = await this.rooms.getOwner(roomId);

            if (owner != req.user.userId) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            const exists = await this.rooms.roomExists(newTitle, req.user.userId);

            if (exists) {
                throw new AppError(ROOM_ALREADY_EXISTS);
            }

            const result = await this.rooms.rename(roomId, req.user.userId, newTitle);

            if (!result) {
                throw new AppError(UPDATE_ROOM_ERROR);
            }

            return res.status(200).json({
                message: 'Salle mis � jours avec succ�s.'
            });

        } catch (error) {
            return next(error);
        }
    }

    getRoomById = async (req, res, next) => {
        try {
            const { roomId } = req.params;

            if (!roomId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // Is this room mine
            const owner = await this.rooms.getOwner(roomId);

            if (owner != req.user.userId) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            const room = await this.rooms.getRoomById(roomId);

            if (!room) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            return res.status(200).json({
                data: room
            });
        } catch (error) {
            return next(error);
        }
    }
    getRoomTitle = async (req, res, next) => {
        try {
            const { roomId } = req.params;

            if (!roomId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const room = await this.rooms.getRoomById(roomId);

            if (room instanceof Error) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            return res.status(200).json({ title: room.title });
        } catch (error) {
            return next(error);
        }
    }
    roomExists = async (req, res, next) => {
        try {
            const { title } = req.body;

            if (!title) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const exists = await this.rooms.roomExists(title);

            return res.status(200).json({
                exists: exists
            });
        } catch (error) {
            return next(error);
        }
    }
    getRoomTitleByUserId = async (req, res, next) => {
        try {
            const { userId } = req.params;

            // V�rification que l'userId est valide
            if (!userId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            // R�cup�rer les salles de l'utilisateur
            const rooms = await this.rooms.getUserRooms(userId);

            if (!rooms || rooms.length === 0) {
                throw new AppError(ROOM_NOT_FOUND);
            }

            // Extraire uniquement les titres des salles
            const roomTitles = rooms.map(room => room.title);

            return res.status(200).json({
                titles: roomTitles
            });
        } catch (error) {
            return next(error);
        }
    }


}

module.exports = RoomsController;