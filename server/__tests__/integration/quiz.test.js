const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');
const jwt = require('../../middleware/jwtToken');

describe('Quiz API Integration Tests', () => {
  let token;
  let testUserId = 'test-user-123';

  beforeAll(async () => {
    // Connect to DB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/evaluetonsavoir';
    await mongoose.connect(mongoUri);
    
    // Insert test user if not exists
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ userId: testUserId });
    if (!existingUser) {
      await usersCollection.insertOne({
        userId: testUserId,
        email: 'test@example.com',
        roles: ['teacher']
      });
    }
    
    // Generate JWT
    const jwtInstance = new jwt();
    token = jwtInstance.create('test@example.com', testUserId, ['teacher']);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('POST /api/quiz/create', () => {
    it('should create a quiz successfully', async () => {
      const quizData = {
        title: 'Integration Test Quiz',
        questions: [
          {
            text: 'What is 2+2?',
            options: ['3', '4', '5'],
            correct: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/quiz/create')
        .set('Authorization', `Bearer ${token}`)
        .send(quizData)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.title).toBe('Integration Test Quiz');

      // Verify in DB
      const db = mongoose.connection.db;
      const quizzesCollection = db.collection('quizzes');
      const quiz = await quizzesCollection.findOne({ _id: mongoose.Types.ObjectId(response.body._id) });
      expect(quiz).toBeTruthy();
      expect(quiz.title).toBe('Integration Test Quiz');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/quiz/create')
        .send({ title: 'Test Quiz' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});