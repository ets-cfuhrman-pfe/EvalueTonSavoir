jest.mock("../../middleware/AppError", () => {
  const actualAppError = jest.requireActual("../../middleware/AppError");

  return jest.fn().mockImplementation((message, statusCode) => {
    return new actualAppError(message, statusCode);
  });
});

const Rooms = require("../../models/room");
const ValidationUtils = require("../../utils/validationUtils");
const ObjectId = require("mongodb").ObjectId;
const validationConstants = require("../../shared/validationConstants.json");

describe("Rooms", () => {
  let rooms;
  let db;
  let collection;

  beforeEach(() => {
    jest.clearAllMocks();

    collection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
      find: jest.fn().mockReturnValue({ toArray: jest.fn() }),
      deleteOne: jest.fn(),
      deleteMany: jest.fn(),
      updateOne: jest.fn(),
    };

    db = {
      connect: jest.fn(),
      getConnection: jest.fn().mockReturnThis(),
      collection: jest.fn().mockReturnValue(collection),
    };

    rooms = new Rooms(db);
  });

  describe("create", () => {
    it("should return insertedId on success", async () => {
      collection.findOne.mockResolvedValue(null);
      collection.insertOne.mockResolvedValue({ insertedId: "abc123" });

      const result = await rooms.create("test", "userId");
      expect(result).toBe("abc123");
    });

    it("should throw error when userId is missing", async () => {
      await expect(rooms.create("test", undefined)).rejects.toThrowError(
        new Error("Missing required parameter(s)", 400)
      );
    });

    it("should throw conflict error when room exists", async () => {
      collection.findOne.mockResolvedValue({
        _id: "660c72b2f9b1d8b3a4c8e4d3b",
        userId: "12345",
        title: "existing room",
      });

      await expect(rooms.create("existing room", "12345")).rejects.toThrowError(
        new Error("Room already exists", 409)
      );
    });
  });
  describe("getUserRooms", () => {
    it("should return all rooms for a user", async () => {
      const userId = "12345";
      const userRooms = [
        { title: "room 1", userId },
        { title: "room 2", userId },
      ];

      collection.find().toArray.mockResolvedValue(userRooms);

      const result = await rooms.getUserRooms(userId);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(userRooms);
    });
  });

  describe("getOwner", () => {
    it("should return the owner of a room", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";
      const userId = "12345";

      collection.findOne.mockResolvedValue({ userId });

      const result = await rooms.getOwner(roomId);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(roomId),
      });
      expect(result).toBe(userId);
    });
  });

  describe("delete", () => {
    it("should delete a room and return true", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";

      collection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await rooms.delete(roomId);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(roomId),
      });
      expect(result).toBe(true);
    });

    it("should return false if the room does not exist", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";

      collection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await rooms.delete(roomId);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(roomId),
      });
      expect(result).toBe(false);
    });
  });

  describe("rename", () => {
    it("should rename a room and return true", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";
      const newTitle = "new room name";
      const userId = "12345";

      collection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const result = await rooms.rename(roomId, userId, newTitle);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(roomId), userId: userId },
        { $set: { title: newTitle } }
      );
      expect(result).toBe(true);
    });

    it("should return false if the room does not exist", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";
      const newTitle = "new room name";
      const userId = "12345";

      collection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      const result = await rooms.rename(roomId, userId, newTitle);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.updateOne).toHaveBeenCalledWith(
        { _id: new ObjectId(roomId), userId: userId },
        { $set: { title: newTitle } }
      );
      expect(result).toBe(false);
    });

    it("should throw an error if the new title is already in use", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";
      const newTitle = "existing room";
      const userId = "12345";

      collection.findOne.mockResolvedValue({ title: newTitle });
      collection.updateOne.mockResolvedValue({ modifiedCount: 0 });

      await expect(rooms.rename(roomId, userId, newTitle)).rejects.toThrow(
        "Room with name 'existing room' already exists."
      );

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.findOne).toHaveBeenCalledWith({
        userId: userId,
        title: newTitle,
      });
    });
  });

  describe("roomExists", () => {
    it("should return true if room exists", async () => {
      const title = "TEST ROOM";
      const userId = '66fc70bea1b9e87655cf17c9';
  
      collection.findOne.mockResolvedValue({ title, userId });
  
      const result = await rooms.roomExists(title, userId);
  
      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.findOne).toHaveBeenCalledWith({ title: title.toUpperCase(), userId });
      expect(result).toBe(true);
    });
  
    it("should return false if room does not exist", async () => {
      const title = "NONEXISTENT ROOM";
      const userId = '66fc70bea1b9e87655cf17c9';
  
      collection.findOne.mockResolvedValue(null);
  
      const result = await rooms.roomExists(title, userId);
  
      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith('rooms');
      expect(collection.findOne).toHaveBeenCalledWith({ title: title.toUpperCase(), userId });
      expect(result).toBe(false);
    });
  });
  
  describe("getRoomById", () => {
    it("should return a room by ID", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";
      const room = {
        _id: new ObjectId(roomId),
        title: "test room",
      };

      collection.findOne.mockResolvedValue(room);

      const result = await rooms.getRoomById(roomId);

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(roomId),
      });
      expect(result).toEqual(room);
    });

    it("should throw an error if the room does not exist", async () => {
      const roomId = "60c72b2f9b1d8b3a4c8e4d3b";

      collection.findOne.mockResolvedValue(null);

      await expect(rooms.getRoomById(roomId)).rejects.toThrowError(
        new Error(`Room ${roomId} not found`, 404)
      );

      expect(db.connect).toHaveBeenCalled();
      expect(db.collection).toHaveBeenCalledWith("rooms");
      expect(collection.findOne).toHaveBeenCalledWith({
        _id: new ObjectId(roomId),
      });
    });
  });

  describe("Room Field Length Validation", () => {
    describe("Room name length validation", () => {
      it("should accept room names with valid lengths", () => {
        const validNames = [
          "A",                    // minimum length (1 character)
          "Valid Room",           // normal length
          "A".repeat(validationConstants.room.name.maxLength)          // maximum length
        ];

        validNames.forEach(name => {
          const validation = ValidationUtils.validateRoomName(name);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toEqual([]);
        });
      });

      it("should accept room names with accented characters", () => {
        const validNamesWithAccents = [
          "Salle de Français",     
          "Gérard",                  
          "Müller",                
          "Niño",                  
          "José-María-Château-è"             
        ];

        validNamesWithAccents.forEach(name => {
          const validation = ValidationUtils.validateRoomName(name);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toEqual([]);
        });
      });

      it("should reject room names that are too short", () => {
        const shortName = ""; // 0 characters (below minimum of 1)
        
        const validation = ValidationUtils.validateRoomName(shortName);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          "Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces"
        );
      });

      it("should reject room names that are too long", () => {
        const longName = "A".repeat(validationConstants.room.name.maxLength + 1); // exceeds maximum
        
        const validation = ValidationUtils.validateRoomName(longName);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          "Le nom de la salle ne peut contenir que des lettres, chiffres, tirets, underscores et espaces"
        );
      });
    });

    describe("Room description length validation", () => {
      it("should accept descriptions with valid lengths", () => {
        const validDescriptions = [
          "",                     // empty description (no minimum)
          "Short description",    // normal length
          "A".repeat(validationConstants.room.description.maxLength)         // maximum length
        ];

        validDescriptions.forEach(description => {
          const validation = ValidationUtils.validateRoomDescription(description);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toEqual([]);
        });
      });

      it("should reject descriptions that are too long", () => {
        const longDescription = "A".repeat(validationConstants.room.description.maxLength + 1); // exceeds maximum
        
        const validation = ValidationUtils.validateRoomDescription(longDescription);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          "La description ne peut pas dépasser 500 caractères"
        );
      });
    });

    describe("Room password length validation", () => {
      it("should accept passwords with valid lengths", () => {
        const validPasswords = [
          "A".repeat(validationConstants.room.password.minLength),                 // minimum length
          "password123",          // normal length
          "A".repeat(validationConstants.room.password.maxLength)          // maximum length
        ];

        validPasswords.forEach(password => {
          const validation = ValidationUtils.validateRoomPassword(password);
          expect(validation.isValid).toBe(true);
          expect(validation.errors).toEqual([]);
        });
      });

      it("should reject passwords that are too short", () => {
        const shortPasswords = [
          "",       // 0 characters
          "1",      // 1 character
          "12",     // 2 characters
          "A".repeat(validationConstants.room.password.minLength - 1)     // below minimum
        ];

        shortPasswords.forEach(password => {
          const validation = ValidationUtils.validateRoomPassword(password);
          expect(validation.isValid).toBe(false);
          expect(validation.errors).toContain(
            "Le mot de passe doit contenir entre 4 et 50 caractères"
          );
        });
      });

      it("should reject passwords that are too long", () => {
        const longPassword = "A".repeat(validationConstants.room.password.maxLength + 1); // exceeds maximum
        
        const validation = ValidationUtils.validateRoomPassword(longPassword);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(
          "Le mot de passe doit contenir entre 4 et 50 caractères"
        );
      });
    });

    describe("Edge cases for length validation", () => {
      it("should handle exact boundary lengths correctly", () => {
        // Test exact boundary values
        const testCases = [
          { method: 'validateRoomName', value: "A", shouldPass: true },           
          { method: 'validateRoomName', value: "A".repeat(validationConstants.room.name.maxLength), shouldPass: true }, 
          { method: 'validateRoomDescription', value: "A".repeat(validationConstants.room.description.maxLength), shouldPass: true }, 
          { method: 'validateRoomPassword', value: "A".repeat(validationConstants.room.password.minLength), shouldPass: true },    
          { method: 'validateRoomPassword', value: "A".repeat(validationConstants.room.password.maxLength), shouldPass: true } 
        ];

        testCases.forEach(({ method, value, shouldPass }) => {
          const validation = ValidationUtils[method](value);
          expect(validation.isValid).toBe(shouldPass);
          if (shouldPass) {
            expect(validation.errors).toEqual([]);
          }
        });
      });
    });
  });
});
