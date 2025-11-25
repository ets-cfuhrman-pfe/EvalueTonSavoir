const request = require('supertest');
const bcrypt = require('bcrypt');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Rooms API Integration Tests', () => {
  let app;
  let token;
  let testUserEmail = `rooms_test_${Date.now()}@example.com`;
  let testUserPassword = 'password123';
  let testUserId;
  let db;
  let createdRoomId;

  beforeAll(async () => {
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');

    // Create test user
    const dbConn = db.getConnection();
    const usersCollection = dbConn.collection('users');
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    const result = await usersCollection.insertOne({
      email: testUserEmail,
      password: hashedPassword,
      roles: ['teacher'],
      name: 'Rooms Test User'
    });
    testUserId = result.insertedId.toString();

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/simple-auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);
    
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    const dbConn = db.getConnection();
    const roomsCollection = dbConn.collection('rooms');
    await roomsCollection.deleteMany({ userId: testUserId });
    
    const usersCollection = dbConn.collection('users');
    await usersCollection.deleteOne({ email: testUserEmail });
    
    await db.closeConnection();
  });

  describe('Room Operations', () => {
    it('should create a room', async () => {
      const response = await request(app)
        .post('/api/room/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Test Room' })
        .expect(201);

      expect(response.body).toHaveProperty('roomId');
      createdRoomId = response.body.roomId;
    });

    it('should check if room exists', async () => {
      const response = await request(app)
        .post('/api/room/roomExists')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomName: 'New Test Room' })
        .expect(200);

      expect(response.body.exists).toBe(true);
    });

    it('should get user rooms', async () => {
      const response = await request(app)
        .get('/api/room/getUserRooms')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      const room = response.body.data.find(r => r._id === createdRoomId);
      expect(room).toBeDefined();
      expect(room.title).toBe('NEW TEST ROOM');
    });

    it('should rename a room', async () => {
      await request(app)
        .put('/api/room/rename')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          roomId: createdRoomId,
          newTitle: 'Renamed Test Room'
        })
        .expect(200);

      // Verify rename
      const response = await request(app)
        .get('/api/room/getUserRooms')
        .set('Authorization', `Bearer ${token}`);
      
      const room = response.body.data.find(r => r._id === createdRoomId);
      expect(room.title).toBe('RENAMED TEST ROOM'); 
    });

    it('should delete a room', async () => {
      await request(app)
        .delete(`/api/room/delete/${createdRoomId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      const response = await request(app)
        .get('/api/room/getUserRooms')
        .set('Authorization', `Bearer ${token}`);
      
      const room = response.body.data.find(r => r._id === createdRoomId);
      expect(room).toBeUndefined();
    });
  });
});
