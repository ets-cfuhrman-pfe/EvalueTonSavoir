const request = require('supertest');
const bcrypt = require('bcrypt');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000); // Timeout for slow connections

describe('Quiz API Integration Tests', () => {
  let app;
  let token;
  let testUserEmail = process.env.TEST_USER_EMAIL;
  let testUserPassword = process.env.TEST_USER_PASSWORD;
  let createdTestUser = false;
  let testFolderId;
  let testUserId;
  let db;

  if (!testUserEmail || !testUserPassword) {
    createdTestUser = true;
    const now = Date.now();
    testUserEmail = `integration-test-${now}@example.com`;
    testUserPassword = `P@ssw0rd-${now}`;
  }

  beforeAll(async () => { 
    // Connect to DB first
    db = require('../../config/db');
    await db.connect();
    
    // Cleanup any lingering test rooms before starting
    const dbConn = db.getConnection();
    const roomsCollection = dbConn.collection('rooms');
    await roomsCollection.deleteMany({ title: /^ROOM_/ });
    
    // Now require app (after DB is connected)
    app = require('../../app');
    
    // Insert test user if not exists
    const usersCollection = dbConn.collection('users');
    const existingUser = await usersCollection.findOne({ email: testUserEmail });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(testUserPassword, 10);
      const userId = (await usersCollection.insertOne({
        email: testUserEmail,
        password: hashedPassword,
        roles: ['teacher'],
        name: 'Integration Test Bot'
      })).insertedId;
      testUserId = userId.toString();
      
      // Create default folder
      const foldersCollection = dbConn.collection('folders');
      const folderId = (await foldersCollection.insertOne({
        title: 'Dossier par Défaut',
        userId: testUserId,
        created_at: new Date()
      })).insertedId;
      testFolderId = folderId.toString();
    } else {
      testUserId = existingUser._id.toString();
      // Get existing folder or create if not exists
      const foldersCollection = dbConn.collection('folders');
      let folder = await foldersCollection.findOne({ userId: testUserId });
      if (!folder) {
        const folderId = (await foldersCollection.insertOne({
          title: 'Dossier par Défaut',
          userId: testUserId,
          created_at: new Date()
        })).insertedId;
        testFolderId = folderId.toString();
      } else {
        testFolderId = folder._id.toString();
      }
    }
    
    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/simple-auth/login')
      .send({ email: testUserEmail, password: testUserPassword })
      .expect(200);
    
    token = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test data
    const dbConn = db.getConnection();
    const quizzesCollection = dbConn.collection('quizzes');
    await quizzesCollection.deleteMany({ folderId: testFolderId });
    
    const foldersCollection = dbConn.collection('folders');
    // Only remove folders/users when we created them for this run.
    if (createdTestUser) {
      await foldersCollection.deleteMany({ userId: testUserId });
      const usersCollection = dbConn.collection('users');
      await usersCollection.deleteOne({ email: testUserEmail });
    }
    
    // Cleanup test rooms
    const roomsCollection = dbConn.collection('rooms');
    await roomsCollection.deleteMany({ title: /^ROOM_/ });
    
    // Cleanup: close DB connection
    await db.closeConnection();
  });

  describe('POST /api/quiz/create', () => {
    it('should create a quiz successfully', async () => {
      const quizData = {
        title: `Integration Test Quiz ${Date.now()}`,
        content: [
          {
            text: 'What is 2+2?',
            options: ['3', '4', '5'],
            correct: 1
          }
        ],
        folderId: testFolderId
      };

      const response = await request(app)
        .post('/api/quiz/create')
        .set('Authorization', `Bearer ${token}`)
        .send(quizData)
        .expect(200);

      expect(response.body).toHaveProperty('quizId');
      expect(response.body.message).toBe('Quiz créé avec succès.');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/quiz/create')
        .send({ title: 'Test Quiz' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});