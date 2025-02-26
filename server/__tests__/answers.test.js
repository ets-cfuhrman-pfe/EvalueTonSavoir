const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const answersRouter = require('../routers/answers'); // Ensure the correct path
const Answer = require('../models/answers');

const app = express();
app.use(bodyParser.json());
app.use('/api', answersRouter);

// Mock the Answer model methods
jest.mock('../models/answers');

describe('Answers API', () => {
    beforeEach(() => {
        // Clear all instances and calls to constructor and all methods:
        Answer.create.mockClear();
        Answer.get.mockClear();
        Answer.getAll.mockClear();
        Answer.delete.mockClear();
    });

    test('should create a new answer', async () => {
        const mockAnswer = { id: 1, answerText: 'This is an answer', showFeedback: true, points: 10 };
        Answer.create.mockReturnValue(mockAnswer);

        const response = await request(app)
            .post('/api/answers')
            .send({ answerText: 'This is an answer', showFeedback: true, points: 10 });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Answer created successfully.');
        expect(response.body.answer).toHaveProperty('id');
        expect(response.body.answer.answerText).toBe('This is an answer');
        expect(response.body.answer.showFeedback).toBe(true);
        expect(response.body.answer.points).toBe(10);
    });

    test('should get an answer by ID', async () => {
        const mockAnswer = { id: 1, answerText: 'This is an answer', showFeedback: true, points: 10 };
        Answer.get.mockReturnValue(mockAnswer);

        const response = await request(app).get(`/api/answers/1`);

        expect(response.status).toBe(200);
        expect(response.body.answerText).toBe('This is an answer');
        expect(response.body.showFeedback).toBe(true);
        expect(response.body.points).toBe(10);
    });

    test('should return 404 if answer not found', async () => {
        Answer.get.mockReturnValue(null);

        const response = await request(app).get('/api/answers/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Answer not found');
    });

    test('should delete an answer by ID', async () => {
        const mockAnswer = { id: 1, answerText: 'This is an answer', showFeedback: true, points: 10 };
        Answer.delete.mockReturnValue(mockAnswer);

        const response = await request(app).delete(`/api/answers/1`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Answer deleted successfully.');

        const getResponse = await request(app).get(`/api/answers/1`);
        expect(getResponse.status).toBe(404);
    });

    test('should return 404 if deleting an answer that does not exist', async () => {
        Answer.delete.mockReturnValue(null);

        const response = await request(app).delete('/api/answers/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Answer not found');
    });
});