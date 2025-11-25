const request = require('supertest');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Quizzes API Integration Tests', () => {
  let app;
  let db;
  let token;
  let testUserEmail;
  let testUserName;
  let testUserPassword = 'testUserPassword';
  let testFolderId;
  let testQuizId;

  let testAdminEmail;
  let testAdminToken;
  
  let testOtherUserEmail;
  let testOtherUserToken;

  // Test Data Variables
  const QUIZ_TITLE = 'Integration Test Quiz';
  const QUIZ_CONTENT = '::Question Title:: Question Text {=Answer}';
  const UPDATED_QUIZ_TITLE = 'Updated Quiz Title';
  const UPDATED_QUIZ_CONTENT = '::New Question:: New Text {=New Answer}';
  const FOLDER_TITLE = 'Test Quiz Folder';

  beforeAll(async () => {
    jest.resetModules();
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');
    
    // Main User (Teacher)
    testUserEmail = 'quiz_test_' + Date.now() + Math.floor(Math.random() * 1000) + '@example.com';
    testUserName = 'quiztestuser' + Date.now() + Math.floor(Math.random() * 1000);

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

    const loginRes = await request(app)
      .post('/api/user/login')
      .send({
        email: testUserEmail,
        password: testUserPassword
      });
    
    token = loginRes.body.token;

    // Admin User
    testAdminEmail = 'admin_test_' + Date.now() + Math.floor(Math.random() * 1000) + '@example.com';
    await usersCollection.deleteOne({ email: testAdminEmail });
    
    // Register admin 
    await request(app)
      .post('/api/user/register')
      .send({
        username: 'admintest',
        email: testAdminEmail,
        password: testUserPassword,
        roles: ['admin'] 
      });
    
    await usersCollection.updateOne({ email: testAdminEmail }, { $set: { roles: ['admin'] } });

    const adminLoginRes = await request(app)
      .post('/api/user/login')
      .send({
        email: testAdminEmail,
        password: testUserPassword
      });
    testAdminToken = adminLoginRes.body.token;

    // Other User (Teacher 2)
    testOtherUserEmail = 'other_test_' + Date.now() + Math.floor(Math.random() * 1000) + '@example.com';
    await usersCollection.deleteOne({ email: testOtherUserEmail });

    await request(app)
      .post('/api/user/register')
      .send({
        username: 'othertest',
        email: testOtherUserEmail,
        password: testUserPassword,
        roles: ['teacher']
      });

    const otherLoginRes = await request(app)
      .post('/api/user/login')
      .send({
        email: testOtherUserEmail,
        password: testUserPassword
      });
    testOtherUserToken = otherLoginRes.body.token;

    // Create a folder for quizzes (Main User)
    const folderRes = await request(app)
      .post('/api/folder/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: FOLDER_TITLE });
    
    testFolderId = folderRes.body.folderId;
  });

  afterAll(async () => {
    if (db) {
      try {
        const dbConn = db.getConnection();
        if (dbConn) {
          const usersCollection = dbConn.collection('users');
          await usersCollection.deleteOne({ email: testUserEmail });
          await usersCollection.deleteOne({ email: testAdminEmail });
          await usersCollection.deleteOne({ email: testOtherUserEmail });
          
          // Cleanup quizzes and folders
          if (testQuizId) {
             const quizzesCollection = dbConn.collection('quizzes');
            await quizzesCollection.deleteOne({ _id: new require('mongodb').ObjectId(testQuizId) });
          }
        }
        await db.closeConnection();
      } catch (_e) {
        // ignore
      }
    }
  });

  describe('Quiz Management', () => {
    it('should create a quiz', async () => {
      const response = await request(app)
        .post('/api/quiz/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: QUIZ_TITLE,
          content: QUIZ_CONTENT,
          folderId: testFolderId
        })
        .expect(200);

      expect(response.body).toHaveProperty('quizId');
      testQuizId = response.body.quizId;
    });

    it('should get a quiz', async () => {
      const response = await request(app)
        .get(`/api/quiz/get/${testQuizId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('title', QUIZ_TITLE);
    });

    it('should update a quiz', async () => {
      await request(app)
        .put('/api/quiz/update')
        .set('Authorization', `Bearer ${token}`)
        .send({
          quizId: testQuizId,
          newTitle: UPDATED_QUIZ_TITLE,
          newContent: UPDATED_QUIZ_CONTENT
        })
        .expect(200);

      // Verify update
      const response = await request(app)
        .get(`/api/quiz/get/${testQuizId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('title', UPDATED_QUIZ_TITLE);
    });

    it('should allow admin to get any quiz', async () => {
      const response = await request(app)
        .get(`/api/quiz/get/${testQuizId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('title', UPDATED_QUIZ_TITLE);
    });

    it('should not allow other user to get a quiz', async () => {
      await request(app)
        .get(`/api/quiz/get/${testQuizId}`)
        .set('Authorization', `Bearer ${testOtherUserToken}`)
        .expect(404); // QUIZ_NOT_FOUND
    });

    it('should delete a quiz', async () => {
      await request(app)
        .delete(`/api/quiz/delete/${testQuizId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/quiz/get/${testQuizId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404); // Assuming 404 for not found
    });
  });
});
