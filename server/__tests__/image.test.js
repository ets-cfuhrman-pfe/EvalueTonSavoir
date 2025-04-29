/* eslint-disable */

// const request = require('supertest');
// const app = require('../app.js');
// // const app = require('../routers/images.js');
// const { response } = require('express');

// const BASE_URL = '/image'

const Images = require('../models/images');
const ObjectId = require('mongodb').ObjectId;

describe.skip("POST /upload", () => {

    describe("when the jwt is not sent", () => {

        test('should respond with 401 status code', async () => {
            const response = await request(app).post(BASE_URL + "/upload").send()
            expect(response.statusCode).toBe(401)
        })
        // respond message Accès refusé. Aucun jeton fourni.

    })

    describe("when sent bad jwt", () => {
        // respond with 401
        // respond message Accès refusé. Jeton invalide.

    })

    describe("when sent no variables", () => {
        // respond message Paramètre requis manquant.
        // respond code 400

    })

    describe("when sent not an image file", () => {
        // respond code 505
    })

    describe("when sent image file", () => {
        // respond code 200
        // json content type
        // test("should reply with content type json", async () => {
        //     const response = await request(app).post(BASE_URL+'/upload').send()
        //     expect(response.headers['content-type']).toEqual(expect.stringContaining('json'))
        // })
    })

})

describe.skip("GET /get", () => {

    describe("when not give id", () => {

    })

    describe("when not good id", () => {

    })

    describe("when good id", () => {
        // respond code 200
        // image content type
        // response has something

    })

})

jest.mock('mongodb', () => {
    const originalModule = jest.requireActual('mongodb');
    return {
        ...originalModule,
        ObjectId: {
            ...originalModule.ObjectId,
            createFromHexString: jest.fn().mockReturnValue('507f191e810c19729de860ea'), // Return a valid 24-character ObjectId string
        },
    };
});

describe('Images', () => {
    let db;
    let images;
    let dbConn;
    let mockImagesCollection;
    let mockFindCursor;

    beforeEach(() => {
            
    const mockImagesCursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn()
    };

    const mockFilesCursor = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        toArray: jest.fn()
    };

        mockImagesCollection = {
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'image123' }),
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue(mockImagesCursor),
            countDocuments: jest.fn(),
            deleteOne: jest.fn()
        };

        mockFilesCollection = {
            find: jest.fn().mockReturnValue(mockFilesCursor)
        };
        
        dbConn = {
            collection: jest.fn((name) => {
                if (name === 'images') {
                    return mockImagesCollection;
                } else if (name === 'files') {
                    return mockFilesCollection;
                }
            })
        };

        db = {
            connect: jest.fn().mockResolvedValue(),
            getConnection: jest.fn().mockReturnValue(dbConn)
        };

        images = new Images(db);
    });

    describe('upload', () => {
        it('should upload an image and return the inserted ID', async () => {
            const testFile = { originalname: 'test.png', buffer: Buffer.from('dummydata'), mimetype: 'image/png' };
            const userId = 'user123';

            const result = await images.upload(testFile, userId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(dbConn.collection).toHaveBeenCalledWith('images');
            expect(mockImagesCollection.insertOne).toHaveBeenCalledWith({
                userId: userId,
                file_name: 'test.png',
                file_content: testFile.buffer.toString('base64'),
                mime_type: 'image/png',
                created_at: expect.any(Date)
            });
            expect(result).toBe('image123');
        });
    });

    describe('get', () => {
        it('should retrieve the image if found', async () => {
            const imageId = '65d9a8f9b5e8d1a5e6a8c9f0';
            const testImage = {
                file_name: 'test.png',
                file_content: Buffer.from('dummydata').toString('base64'),
                mime_type: 'image/png'
            };
            mockImagesCollection.findOne.mockResolvedValue(testImage);

            const result = await images.get(imageId);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(dbConn.collection).toHaveBeenCalledWith('images');
            expect(mockImagesCollection.findOne).toHaveBeenCalledWith({ _id: ObjectId.createFromHexString(imageId) });
            expect(result).toEqual({
                file_name: 'test.png',
                file_content: Buffer.from('dummydata'),
                mime_type: 'image/png'
            });
        });

        it('should return null if image is not found', async () => {
            const imageId = '65d9a8f9b5e8d1a5e6a8c9f0';
            mockImagesCollection.findOne.mockResolvedValue(null);

            const result = await images.get(imageId);

            expect(result).toBeNull();
        });
    });

    describe('getImages', () => {
        it('should retrieve a paginated list of images', async () => {
            const mockImages = [
                { _id: '1', userId: 'user1', file_name: 'image1.png', file_content: Buffer.from('data1'), mime_type: 'image/png' },
                { _id: '2', userId: 'user2', file_name: 'image2.png', file_content: Buffer.from('data2'), mime_type: 'image/png' }
            ];
    
            mockImagesCollection.countDocuments.mockResolvedValue(2);
            // Create a mock cursor for images collection
            const mockFindCursor = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue(mockImages),  // Return mock images when toArray is called
            };
    
            // Mock the find method to return the mock cursor
            mockImagesCollection.find.mockReturnValue(mockFindCursor);
            const result = await images.getImages(1, 10);
    
            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(dbConn.collection).toHaveBeenCalledWith('images');
            expect(mockImagesCollection.find).toHaveBeenCalledWith({});
            expect(mockFindCursor.sort).toHaveBeenCalledWith({ created_at: 1 });
            expect(mockFindCursor.skip).toHaveBeenCalledWith(0);
            expect(mockFindCursor.limit).toHaveBeenCalledWith(10);
            expect(result).toEqual({
                images: [
                    { id: '1', user: 'user1', file_name: 'image1.png', file_content: 'ZGF0YTE=', mime_type: 'image/png' },
                    { id: '2', user: 'user2', file_name: 'image2.png', file_content: 'ZGF0YTI=', mime_type: 'image/png' }
                ],
                total: 2,
            });
        });
    
        it('should return an empty array if no images are found', async () => {
            mockImagesCollection.countDocuments.mockResolvedValue(0);
    
            const result = await images.getImages(1, 10);
    
            expect(result).toEqual({ images: [], total: 0 });
        });
    });

    describe('getUserImages', () => {
        it('should return empty images array when no images exist', async () => {
            mockImagesCollection.countDocuments.mockResolvedValue(0);
            
            const result = await images.getUserImages(1, 10, 'user123');
            
            expect(result).toEqual({ images: [], total: 0 });
            expect(db.connect).toHaveBeenCalled();
            expect(mockImagesCollection.countDocuments).toHaveBeenCalledWith({ userId: 'user123' });
        });

        it('should return images when they exist', async () => {
            const mockImages = [
                {
                    _id: 'img1',
                    userId: 'user123',
                    file_name: 'image1.png',
                    file_content: Buffer.from('testdata'),
                    mime_type: 'image/png'
                }
            ];

            mockImagesCollection.countDocuments.mockResolvedValue(1);
            mockImagesCollection.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                toArray: jest.fn().mockResolvedValue(mockImages)
            });

            const result = await images.getUserImages(1, 10, 'user123');
            
            expect(result).toEqual({
                images: [
                    {
                        id: 'img1',
                        user: 'user123',
                        file_name: 'image1.png',
                        file_content: Buffer.from('testdata').toString('base64'),
                        mime_type: 'image/png'
                    }
                ],
                total: 1
            });
            expect(db.connect).toHaveBeenCalled();
            expect(mockImagesCollection.countDocuments).toHaveBeenCalledWith({ userId: 'user123' });
        });
    });
    describe('delete', () => {
        it('should not delete the image when it exists in the files collection', async () => {
            const uid = 'user123';
            const imgId = '507f191e810c19729de860ea';  // A valid 24-character ObjectId string

            // Mock the files collection cursor to simulate an image found
            const mockFilesCursor = {
                toArray: jest.fn().mockResolvedValue([{ _id: imgId }])  // Image found
            };

            mockFilesCollection.find.mockReturnValue(mockFilesCursor);
            mockImagesCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

            const result = await images.delete(uid, imgId);

            // Ensure the files collection is queried
            expect(dbConn.collection).toHaveBeenCalledWith('files');
            expect(mockFilesCollection.find).toHaveBeenCalledWith({
                userId: uid,
                content: { $regex: new RegExp(`/api/image/get/${imgId}`) },
            });

            // Ensure the images collection is queried for deletion
            expect(dbConn.collection).toHaveBeenCalledWith('files');
            expect(mockImagesCollection.deleteOne).not.toHaveBeenCalledWith({
                _id: ObjectId.createFromHexString(imgId), // Ensure the ObjectId is created correctly
            });

            expect(result).toEqual({ deleted: false });
        });

        it('should delete the image if not found in the files collection', async () => {
            const uid = 'user123';
            const imgId = '507f191e810c19729de860ea';

            // Mock the files collection cursor to simulate the image not being found
            const mockFindCursor = {
                toArray: jest.fn().mockResolvedValue([])  // Empty array means image not found
            };

            mockFilesCollection.find.mockReturnValue(mockFindCursor);
            mockImagesCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

            const result = await images.delete(uid, imgId);

            // Ensure the deleteOne is not called if the image is not found
            expect(mockImagesCollection.deleteOne).toHaveBeenCalled();
            expect(result).toEqual({ deleted: true });
        });

        it('should return false if the delete operation fails in the images collection', async () => {
            const uid = 'user123';
            const imgId = '507f191e810c19729de860ea';

            // Mock the files collection cursor to simulate the image being found
            const mockFindCursor = {
                toArray: jest.fn().mockResolvedValue([{ _id: imgId }])  // Image found
            };

            mockFilesCollection.find.mockReturnValue(mockFindCursor);
            mockImagesCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });  // Simulate failure

            const result = await images.delete(uid, imgId);

            // Ensure the images collection deletion is called
            expect(mockImagesCollection.deleteOne).not.toHaveBeenCalledWith({
                _id: ObjectId.createFromHexString(imgId),  // Ensure the ObjectId is created correctly
            });

            expect(result).toEqual({ deleted: false });
        });
        
    });
});