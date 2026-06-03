const request = require('supertest');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Rooms API Integration Tests', () => {
  let app;
  let token;
  let testUserEmail = `rooms_test_${Date.now()}@example.com`;
  let testUserPassword = 'password123';
  let testUserName = `roomstestuser${Date.now()}`;
  let testUserId;
  let db;
  let createdRoomId;

  // Test Data Variables
  const ROOM_TITLE = 'New Test Room';
  const EXPECTED_ROOM_TITLE = 'NEW TEST ROOM'; // Server uppercases room titles
  const RENAMED_ROOM_TITLE = 'Renamed Test Room';
  const EXPECTED_RENAMED_ROOM_TITLE = 'RENAMED TEST ROOM';

  beforeAll(async () => {
    jest.resetModules();
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');

    // Create test user via API
    const dbConn = db.getConnection();
    const usersCollection = dbConn.collection('users');
    await usersCollection.deleteOne({ email: testUserEmail });

    await request(app)
      .post('/api/user/register')
      .send({
        username: testUserName,
        email: testUserEmail,
        password: testUserPassword,
        roles: ['teacher']
      });

    // Login
    const loginResponse = await request(app)
      .post('/api/auth/simple-auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);
    
    token = loginResponse.body.token;
    
    const user = await usersCollection.findOne({ email: testUserEmail });
    testUserId = user._id.toString();
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
        .send({ title: ROOM_TITLE })
        .expect(201);

      expect(response.body).toHaveProperty('roomId');
      createdRoomId = response.body.roomId;
    });

    it('should check if room exists', async () => {
      const response = await request(app)
        .post('/api/room/roomExists')
        .set('Authorization', `Bearer ${token}`)
        .send({ roomName: ROOM_TITLE })
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
      expect(room.title).toBe(EXPECTED_ROOM_TITLE);
    });

    it('should rename a room', async () => {
      await request(app)
        .put('/api/room/rename')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          roomId: createdRoomId,
          newTitle: RENAMED_ROOM_TITLE
        })
        .expect(200);

      // Verify rename
      const response = await request(app)
        .get('/api/room/getUserRooms')
        .set('Authorization', `Bearer ${token}`);
      
      const room = response.body.data.find(r => r._id === createdRoomId);
      expect(room.title).toBe(EXPECTED_RENAMED_ROOM_TITLE); 
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
