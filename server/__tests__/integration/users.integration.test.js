const request = require('supertest');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Users API Integration Tests', () => {
  let app;
  let db;
  let token;
  let testUserEmail;
  let testUserName;
  let testUserPassword = 'testUserPassword';

  beforeAll(async () => {
    jest.resetModules();
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');
    
    testUserEmail = 'users_test_' + Date.now() + Math.floor(Math.random() * 1000) + '@example.com';
    testUserName = 'testuser' + Date.now() + Math.floor(Math.random() * 1000);

    // Ensure user does not exist (just in case)
    const dbConn = db.getConnection();
    const usersCollection = dbConn.collection('users');
    await usersCollection.deleteOne({ email: testUserEmail });
    await usersCollection.deleteOne({ username: testUserName });
  });

  afterAll(async () => {
    if (db) {
      try {
        // Try to clean up if connection exists
        try {
          const dbConn = db.getConnection();
          if (dbConn) {
            const usersCollection = dbConn.collection('users');
            await usersCollection.deleteOne({ email: testUserEmail });
          }
        } catch (error) {
          console.error('Error closing connection:', error);
        }
        await db.closeConnection();
      } catch (error) {
        console.error('Error in afterAll:', error);
      }
    }
  });

  describe('User Management', () => {
    it('should register a user via /api/user/register', async () => {
      const response = await request(app)
        .post('/api/user/register')
        .send({
          username: testUserName,
          email: testUserEmail,
          password: testUserPassword,
          roles: ['teacher']
        })
        .expect(200);
      
      expect(response.body.message).toBe('Utilisateur créé avec succès.');
    });

    it('should login via /api/user/login', async () => {
      const response = await request(app)
        .post('/api/user/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      token = response.body.token;
    });

    it('should change password', async () => {
      const newPassword = 'newpassword123';
      
      await request(app)
        .post('/api/user/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: testUserEmail,
          oldPassword: testUserPassword,
          newPassword: newPassword
        })
        .expect(200);

      // Verify login with new password
      await request(app)
        .post('/api/user/login')
        .send({
          email: testUserEmail,
          password: newPassword
        })
        .expect(200);
        
      // Reset password variable for cleanup/further tests if needed
      testUserPassword = newPassword;
    });

    it('should delete user', async () => {
      // We need to login again because password changed
      const loginRes = await request(app)
        .post('/api/user/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(200);
      
      const newToken = loginRes.body.token;

      await request(app)
        .post('/api/user/delete-user')
        .set('Authorization', `Bearer ${newToken}`)
        .send({
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(200);

      // Verify login fails
      await request(app)
        .post('/api/user/login')
        .send({
          email: testUserEmail,
          password: testUserPassword
        })
        .expect(500); // User not found throws 500 in controller
    });
  });
});
