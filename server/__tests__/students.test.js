const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const studentRoutes = require('../routers/students');
const Student = require('../models/student');

const app = express();
app.use(bodyParser.json());
app.use('/api', studentRoutes);

describe('Students API', () => {
    beforeEach(() => {
        // Reset the in-memory database before each test
        while (Student.getAll().length > 0) {
            Student.delete(Student.getAll()[0].id);
        }
    });

    test('should create a new student', async () => {
        const response = await request(app)
            .post('/api/students')
            .send({ name: 'John Doe', answers: ['Answer 1', 'Answer 2'] });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Student created successfully.');
        expect(response.body.student).toHaveProperty('id');
        expect(response.body.student.name).toBe('John Doe');
        expect(response.body.student.answers).toEqual(['Answer 1', 'Answer 2']);
    });

    test('should get a student by ID', async () => {
        const student = Student.create('Jane Doe', ['Answer 1', 'Answer 2']);
        const response = await request(app).get(`/api/students/${student.id}`);

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Jane Doe');
        expect(response.body.answers).toEqual(['Answer 1', 'Answer 2']);
    });

    test('should return 404 if student not found', async () => {
        const response = await request(app).get('/api/students/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Student not found');
    });

    test('should delete a student by ID', async () => {
        const student = Student.create('John Doe', ['Answer 1', 'Answer 2']);
        const response = await request(app).delete(`/api/students/${student.id}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Student deleted successfully.');

        const getResponse = await request(app).get(`/api/students/${student.id}`);
        expect(getResponse.status).toBe(404);
    });

    test('should return 404 if deleting a student that does not exist', async () => {
        const response = await request(app).delete('/api/students/999');

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Student not found');
    });
});