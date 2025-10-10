const AppError = require("../middleware/AppError.js");
const {
  MISSING_REQUIRED_PARAMETER,
  ROOM_NOT_FOUND,
  ROOM_ALREADY_EXISTS,
  GETTING_ROOM_ERROR,
  DELETE_ROOM_ERROR,
  UPDATE_ROOM_ERROR,
} = require("../constants/errorCodes");

class RoomsController {
  constructor(roomsModel) {
    this.rooms = roomsModel;
    this.getRoomTitle = this.getRoomTitle.bind(this);
  }

  create = async (req, res, next) => {
    try {
      if (!req.user || !req.user.userId) {
        throw new AppError(MISSING_REQUIRED_PARAMETER);
      }      

      const { title } = req.body;
      if (!title) {
        throw new AppError(MISSING_REQUIRED_PARAMETER);
      }

      const normalizedTitle = title.toUpperCase().trim();
      
      const existsStartTime = Date.now();
      const roomExists = await this.rooms.roomExists(normalizedTitle, req.user.userId);
      
      if (roomExists) {
        // Log room creation failure
        if (req.logAction) {
          req.logAction('room_creation_failed', {
            roomTitle: normalizedTitle,
            reason: 'room_already_exists',
            checkTime: `${Date.now() - existsStartTime}ms`
          });
        }
        throw new AppError(ROOM_ALREADY_EXISTS);
      }

      const createStartTime = Date.now();
      const result = await this.rooms.create(normalizedTitle, req.user.userId);
      const createTime = Date.now() - createStartTime;
      const totalTime = Date.now() - existsStartTime;

      // Log successful room creation
      if (req.logDbOperation) {
        req.logDbOperation('insert', 'rooms', createTime, true, {
          roomId: result.insertedId,
          roomTitle: normalizedTitle
        });
      }
      
      if (req.logAction) {
        req.logAction('room_created', {
          roomId: result.insertedId,
          roomTitle: normalizedTitle,
          createTime: `${createTime}ms`,
          totalTime: `${totalTime}ms`
        });
      }

      return res.status(201).json({
        message: "Salle créée avec succès.",
        roomId: result.insertedId,
      });
    } catch (error) {
      next(error);
    }
  };
  

  getUserRooms = async (req, res, next) => {
    try {
      const startTime = Date.now();
      const rooms = await this.rooms.getUserRooms(req.user.userId);
      const retrievalTime = Date.now() - startTime;

      if (!rooms) {
        // Log no rooms found
        if (req.logDbOperation) {
          req.logDbOperation('select', 'rooms', retrievalTime, false, {
            reason: 'no_rooms_found'
          });
        }
        throw new AppError(ROOM_NOT_FOUND);
      }

      // Log successful rooms retrieval
      if (req.logDbOperation) {
        req.logDbOperation('select', 'rooms', retrievalTime, true, {
          roomCount: rooms.length
        });
      }
      
      if (req.logAction) {
        req.logAction('user_rooms_retrieved', {
          roomCount: rooms.length,
          retrievalTime: `${retrievalTime}ms`
        });
      }

      return res.status(200).json({
        data: rooms,
      });
    } catch (error) {
      return next(error);
    }
  };

  getRoomContent = async (req, res, next) => {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        throw new AppError(MISSING_REQUIRED_PARAMETER);
      }
      
      const startTime = Date.now();
      const content = await this.rooms.getContent(roomId);
      const retrievalTime = Date.now() - startTime;

      if (!content) {
        // Log room content not found
        if (req.logDbOperation) {
          req.logDbOperation('select', 'rooms', retrievalTime, false, {
            roomId,
            reason: 'room_content_not_found'
          });
        }
        throw new AppError(GETTING_ROOM_ERROR);
      }

      // Log successful room content retrieval
      if (req.logDbOperation) {
        req.logDbOperation('select', 'rooms', retrievalTime, true, {
          roomId,
          contentType: typeof content
        });
      }
      
      if (req.logAction) {
        req.logAction('room_content_accessed', {
          roomId,
          retrievalTime: `${retrievalTime}ms`
        });
      }

      return res.status(200).json({
        data: content,
      });
    } catch (error) {
      return next(error);
    }
  };

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
        message: "Salle supprimé avec succès.",
      });
    } catch (error) {
      return next(error);
    }
  };

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
        message: "Salle mis à jour avec succès.",
      });
    } catch (error) {
      return next(error);
    }
  };

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
        data: room,
      });
    } catch (error) {
      return next(error);
    }
  };
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
  };
  
  getRoomTitleByUserId = async (req, res, next) => {
    try {
      const { userId } = req.params;

      if (!userId) {
        throw new AppError(MISSING_REQUIRED_PARAMETER);
      }

      const rooms = await this.rooms.getUserRooms(userId);

      if (!rooms || rooms.length === 0) {
        throw new AppError(ROOM_NOT_FOUND);
      }

      const roomTitles = rooms.map((room) => room.title);

      return res.status(200).json({
        titles: roomTitles,
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = RoomsController;
