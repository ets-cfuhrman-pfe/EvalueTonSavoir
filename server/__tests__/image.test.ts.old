const request = require('supertest');
const app = require('../app.js');
// const app = require('../routers/images.js');
const { response } = require('express');

const BASE_URL = '/image'

describe("POST /upload", () => {

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

describe("GET /get", () => {

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