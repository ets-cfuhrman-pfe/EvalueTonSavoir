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

    beforeEach(() => {
        mockImagesCollection = {
            insertOne: jest.fn().mockResolvedValue({ insertedId: 'image123' }),
            findOne: jest.fn(),
            find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue([]) })
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

    describe('getAll', () => {
        it('should retrieve a paginated list of images', async () => {
            const mockImages = [
                { id: '1', file_name: 'image1.png', file_content: Buffer.from('data1').toString('base64'), mime_type: 'image/png' },
                { id: '2', file_name: 'image2.png', file_content: Buffer.from('data2').toString('base64'), mime_type: 'image/png' }
            ];
            mockImagesCollection.find.mockReturnValue({ sort: jest.fn().mockReturnValue(mockImages) });

            const result = await images.getAll(1, 10);

            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(dbConn.collection).toHaveBeenCalledWith('images');
            expect(mockImagesCollection.find).toHaveBeenCalledWith({});
            expect(result.length).toEqual(mockImages.length);
            expect(result).toEqual([
                { id: '1', file_name: 'image1.png', file_content: Buffer.from('data1'), mime_type: 'image/png' },
                { id: '2', file_name: 'image2.png', file_content: Buffer.from('data2'), mime_type: 'image/png' }
            ]);
        });

        it('should return null if not images is not found', async () => {
            mockImagesCollection.find.mockReturnValue({ sort: jest.fn().mockReturnValue(undefined) });
            const result = await images.getAll(1, 10);
            expect(db.connect).toHaveBeenCalled();
            expect(db.getConnection).toHaveBeenCalled();
            expect(dbConn.collection).toHaveBeenCalledWith('images');
            expect(mockImagesCollection.find).toHaveBeenCalledWith({});
            expect(result).toEqual(null);
        });
    });
});