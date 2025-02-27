const AppError = require("../middleware/AppError");

const ObjectId = require("mongodb").ObjectId;

class Rooms {
  constructor(db) {
    this.db = db;
  }

  async create(title, userId) {
    try {
      if (!title || !userId) {
        throw new AppError("Missing required parameter(s)", 400);
      }

      await this.db.connect();
      const conn = this.db.getConnection();
      const roomsCollection = conn.collection("rooms");
      const normalizedTitle = title.toLowerCase();

      const existingRoom = await roomsCollection.findOne({
        title: normalizedTitle,
        userId: userId,
      });

      if (existingRoom) {
        throw new AppError("Une salle avec ce nom existe déjà", 409);
      }

      const newRoom = {
        userId: userId,
        title: title,
        created_at: new Date(),
      };

      const result = await roomsCollection.insertOne(newRoom);

      return result.insertedId;
    } catch (error) {
      console.error("Error in create function:", error);
      throw new AppError(error.message || "Internal Server Error", 500);
    }
  }

  async getUserRooms(userId) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const result = await roomsCollection.find({ userId: userId }).toArray();

    return result;
  }

  async getOwner(roomId) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const room = await roomsCollection.findOne({
      _id: ObjectId.createFromHexString(roomId),
    });

    return room.userId;
  }

  async getContent(roomId) {
    await this.db.connect();
    const conn = this.db.getConnection();
    const roomsCollection = conn.collection("rooms");
    if (!ObjectId.isValid(roomId)) {
      return null; // Évite d'envoyer une requête invalide
    }

    const result = await roomsCollection.findOne({ _id: new ObjectId(roomId) });

    return result;
  }

  async delete(roomId) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const roomResult = await roomsCollection.deleteOne({
      _id: ObjectId.createFromHexString(roomId),
    });

    if (roomResult.deletedCount != 1) return false;

    return true;
  }

  async rename(roomId, userId, newTitle) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const existingRoom = await roomsCollection.findOne({
      title: newTitle,
      userId: userId,
    });

    if (existingRoom)
      throw new Error(`Room with name '${newTitle}' already exists.`);

    const result = await roomsCollection.updateOne(
      { _id: ObjectId.createFromHexString(roomId), userId: userId },
      { $set: { title: newTitle } }
    );

    if (result.modifiedCount != 1) return false;

    return true;
  }

  async roomExists(title) {
    // Ajouter userId en paramètre
    try {
      await this.db.connect();
      const conn = this.db.getConnection();
      const existingRoom = await conn.collection("rooms").findOne({
        title: title.toLowerCase(),
      });
      return !!existingRoom;
    } catch (_error) {
      throw new AppError("Erreur base de données", 500); // Encapsuler les erreurs
    }
  }

  async getRoomById(roomId) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const room = await roomsCollection.findOne({
      _id: ObjectId.createFromHexString(roomId),
    });

    if (!room) throw new AppError(`Room ${roomId} not found`, 404);

    return room;
  }

  async getRoomWithContent(roomId) {
    const room = await this.getRoomById(roomId);

    const content = await this.getContent(roomId);

    return {
      ...room,
      content: content,
    };
  }
  async getRoomTitleByUserId(userId) {
    await this.db.connect();
    const conn = this.db.getConnection();

    const roomsCollection = conn.collection("rooms");

    const rooms = await roomsCollection.find({ userId: userId }).toArray();

    return rooms.map((room) => room.title);
  }
}

module.exports = Rooms;
