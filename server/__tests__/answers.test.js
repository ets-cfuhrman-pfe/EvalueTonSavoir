const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const answersRouter = require('../routers/answers.js');
const Answer = require('../models/answer');

const app = express();
const cors = require("cors");
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', answersRouter);

describe('Answers API', () => {
    beforeEach(() => {
        // Reset the in-memory database before each test
        while (Answer.getAll().length > 0) {
            Answer.delete(Answer.getAll()[0].id);
        }
    });

    test('should create a new answer', async () => {
        const response = await request(app)
            .post('/api/answers')
            .send({ answerText: 'This is an answer', showFeedback: true, points: 10,goodAnswer: true});

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Answer created successfully.');
        expect(response.body.answer).toHaveProperty('id');
        expect(response.body.answer.answerText).toBe('This is an answer');
        expect(response.body.answer.showFeedback).toBe(true);
        expect(response.body.answer.points).toBe(10);
        expect(response.body.answer.goodAnswer).toBe(true);

    });

    test('should get an answer by ID', async () => {
        const answer = Answer.create('This is an answer', true, 10, true);
        const response = await request(app).get(`/api/answers/${answer.id}`);

        expect(response.status).toBe(200);
        expect(response.body.answerText).toBe('This is an answer');
        expect(response.body.showFeedback).toBe(true);
        expect(response.body.points).toBe(10);
        expect(response.body.goodAnswer).toBe(true);

    });

    test('should return 404 if answer not found', async () => {
        const response = await request(app).get('/api/answers/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Answer not found');
    });

    test('should delete an answer by ID', async () => {
        const answer = Answer.create('This is an answer', true, 10);
        const response = await request(app).delete(`/api/answers/${answer.id}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Answer deleted successfully.');

        const getResponse = await request(app).get(`/api/answers/${answer.id}`);
        expect(getResponse.status).toBe(404);
    });

    test('should return 404 if deleting an answer that does not exist', async () => {
        const response = await request(app).delete('/api/answers/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Answer not found');
    });
});