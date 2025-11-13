const request = require('supertest');
// const jwt = require('../../middleware/jwtToken');
const bcrypt = require('bcrypt');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000); // Timeout for slow connections

describe('Quiz API Integration Tests', () => {
  let app;
  let token;
  let testUserEmail = process.env.TEST_USER_EMAIL || 'integrationTestBot@email.com';
  let testUserPassword = process.env.TEST_USER_PASSWORD || '123456';
  let testFolderId;

  beforeAll(async () => {
    // Connect to DB first
    const db = require('../../config/db');
    await db.connect();
    
    // Now require app (after DB is connected)
    app = require('../../app');
    
    // Insert test user if not exists
    const dbConn = db.getConnection();
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
      
      // Create default folder
      const foldersCollection = dbConn.collection('folders');
      const folderId = (await foldersCollection.insertOne({
        title: 'Dossier par Défaut',
        userId: userId.toString(),
        created_at: new Date()
      })).insertedId;
      testFolderId = folderId.toString();
    } else {
      // Get existing folder or create if not exists
      const foldersCollection = dbConn.collection('folders');
      let folder = await foldersCollection.findOne({ userId: existingUser._id.toString() });
      if (!folder) {
        const folderId = (await foldersCollection.insertOne({
          title: 'Dossier par Défaut',
          userId: existingUser._id.toString(),
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
    // Cleanup: close DB connection
    const db = require('../../config/db');
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