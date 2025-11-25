const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Images API Integration Tests', () => {
  let app;
  let db;
  let token;
  let testUserEmail;
  let testUserName;
  let testUserPassword = 'testUserPassword';
  let testUserId;
  let testImageId;

  beforeAll(async () => {
    jest.resetModules();
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');
    
    testUserEmail = 'images_test_' + Date.now() + Math.floor(Math.random() * 1000) + '@example.com';
    testUserName = 'imagetestuser' + Date.now() + Math.floor(Math.random() * 1000);

    // Ensure user does not exist
    const dbConn = db.getConnection();
    const usersCollection = dbConn.collection('users');
    await usersCollection.deleteOne({ email: testUserEmail });

    // Register and login to get token
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

    // Get user ID
    const user = await usersCollection.findOne({ email: testUserEmail });
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    if (db) {
      try {
        const dbConn = db.getConnection();
        if (dbConn) {
          const usersCollection = dbConn.collection('users');
          await usersCollection.deleteOne({ email: testUserEmail });
          
          if (testImageId) {
             const imagesCollection = dbConn.collection('images');
             // Clean up image if it wasn't deleted by test
             // Note: ObjectId import might be needed if we query by _id directly, 
             // but usually cleanup by user is enough if we delete the user.
             // However, images might be linked.
          }
        }
        await db.closeConnection();
      } catch (_e) {
        // ignore
      }
    }
  });

  describe('Image Management', () => {
    it('should upload an image', async () => {
      // Create a dummy image buffer
      const buffer = Buffer.from('fake image content');
      
      const response = await request(app)
        .post('/api/image/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', buffer, 'test-image.png')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      testImageId = response.body.id;
    });

    it('should get user images', async () => {
      const response = await request(app)
        .get('/api/image/getUserImages')
        .query({ uid: testUserId })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('images');
      expect(Array.isArray(response.body.images)).toBe(true);
      expect(response.body.images.length).toBeGreaterThan(0);
      const uploadedImage = response.body.images.find(img => img.id === testImageId);
      expect(uploadedImage).toBeDefined();
    });

    it('should delete an image', async () => {
      await request(app)
        .delete('/api/image/delete')
        .set('Authorization', `Bearer ${token}`)
        .query({ uid: testUserId, imgId: testImageId })
        .expect(200);

      // Verify deletion
      const response = await request(app)
        .get('/api/image/getUserImages')
        .query({ uid: testUserId })
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      // Check if images array exists and does not contain the deleted image
      if (response.body.images && Array.isArray(response.body.images)) {
         const deletedImage = response.body.images.find(img => img.id === testImageId);
         expect(deletedImage).toBeUndefined();
      }
    });
  });
});
