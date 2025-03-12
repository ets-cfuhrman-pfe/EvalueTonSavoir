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

describe('Images', () => {
    let db;
    let images;
    let dbConn;
    let mockImagesCollection;
    let mockFindCursor;

    beforeEach(() => {

        mockFindCursor = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            toArray: jest.fn(),
        };

        mockImagesCollection = {
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'image123' }),
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue(mockFindCursor),
            countDocuments: jest.fn()
        };

        dbConn = {
            collection: jest.fn().mockReturnValue(mockImagesCollection)
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
            mockFindCursor.toArray.mockResolvedValue(mockImages);
    
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
            mockFindCursor.toArray.mockResolvedValue([]);
    
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
});