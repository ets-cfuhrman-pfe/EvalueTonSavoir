const request = require('supertest');
const bcrypt = require('bcrypt');

// Unmock db for integration test
jest.unmock('../../config/db');

jest.setTimeout(30000);

describe('Folders API Integration Tests', () => {
  let app;
  let token;
  let testUserEmail = `folders_test_${Date.now()}@example.com`;
  let testUserPassword = 'password123';
  let testUserName = `folderstestuser${Date.now()}`;
  let testUserId;
  let db;
  let createdFolderId;

  // Test Data Variables
  const FOLDER_TITLE = 'New Test Folder';
  const RENAMED_FOLDER_TITLE = 'Renamed Test Folder';

  beforeAll(async () => {
    jest.resetModules();
    db = require('../../config/db');
    await db.connect();
    app = require('../../app');

    // Create test user via API (more robust integration test)
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
    const foldersCollection = dbConn.collection('folders');
    await foldersCollection.deleteMany({ userId: testUserId });
    
    const usersCollection = dbConn.collection('users');
    await usersCollection.deleteOne({ email: testUserEmail });
    
    await db.closeConnection();
  });

  describe('Folder Operations', () => {
    it('should create a folder', async () => {
      const response = await request(app)
        .post('/api/folder/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: FOLDER_TITLE })
        .expect(200);

      expect(response.body).toHaveProperty('folderId');
      createdFolderId = response.body.folderId;
    });

    it('should get user folders', async () => {
      const response = await request(app)
        .get('/api/folder/getUserFolders')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      const folder = response.body.data.find(f => f._id === createdFolderId);
      expect(folder).toBeDefined();
      expect(folder.title).toBe(FOLDER_TITLE);
    });

    it('should rename a folder', async () => {
      await request(app)
        .put('/api/folder/rename')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          folderId: createdFolderId,
          newTitle: RENAMED_FOLDER_TITLE
        })
        .expect(200);

      // Verify rename
      const response = await request(app)
        .get('/api/folder/getUserFolders')
        .set('Authorization', `Bearer ${token}`);
      
      const folder = response.body.data.find(f => f._id === createdFolderId);
      expect(folder.title).toBe(RENAMED_FOLDER_TITLE);
    });

    it('should delete a folder', async () => {
      await request(app)
        .delete(`/api/folder/delete/${createdFolderId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify deletion
      const response = await request(app)
        .get('/api/folder/getUserFolders')
        .set('Authorization', `Bearer ${token}`);
      
      const folder = response.body.data.find(f => f._id === createdFolderId);
      expect(folder).toBeUndefined();
    });

    it('should duplicate a folder', async () => {
      // Create a folder to duplicate
      const createRes = await request(app)
        .post('/api/folder/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Folder To Duplicate' })
        .expect(200);
      
      const folderId = createRes.body.folderId;

      // Duplicate it
      const dupRes = await request(app)
        .post('/api/folder/duplicate')
        .set('Authorization', `Bearer ${token}`)
        .send({ folderId: folderId })
        .expect(200);

      expect(dupRes.body).toHaveProperty('newFolderId');
      expect(dupRes.body.newFolderId).not.toBe(folderId);

      // Verify duplication
      const response = await request(app)
        .get('/api/folder/getUserFolders')
        .set('Authorization', `Bearer ${token}`);
      
      const duplicatedFolder = response.body.data.find(f => f._id === dupRes.body.newFolderId);
      expect(duplicatedFolder).toBeDefined();
      expect(duplicatedFolder.title).toContain('Folder To Duplicate');
    });
  });
});
