const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');

// Import validation middleware
const {
    validateUserRegistration,
    validateUserLogin,
    validateQuizCreation,
    validateQuizUpdate,
    validateFolderCreation,
    validateEmailOnly,
    validatePasswordChange
} = require('../middleware/validation');

// Create a test app
const createTestApp = () => {
    const app = express();
    app.use(bodyParser.json());

    // Mock authentication middleware for testing
    const mockAuth = (req, res, next) => {
        req.user = { userId: 'test-user-id' };
        next();
    };

    // Error handler middleware for testing
    const errorHandler = (err, req, res, _next) => {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        return res.status(500).json({ error: err.message || 'Internal server error' });
    };

    // Test routes with validation middleware
    app.post('/test/user/register', validateUserRegistration, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.post('/test/user/login', validateUserLogin, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.post('/test/user/reset-password', validateEmailOnly, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.post('/test/user/change-password', mockAuth, validatePasswordChange, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.post('/test/quiz/create', mockAuth, validateQuizCreation, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.put('/test/quiz/update', mockAuth, validateQuizUpdate, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    app.post('/test/folder/create', mockAuth, validateFolderCreation, (req, res) => {
        res.status(200).json({ message: 'Valid data' });
    });

    // Add error handler at the end
    app.use(errorHandler);

    return app;
};

describe('API Validation Integration Tests', () => {
    let app;

    beforeEach(() => {
        app = createTestApp();
    });

    describe('User Registration Validation', () => {
        test('should accept valid user registration data', async () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'testuser'
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(validData);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Valid data');
        });

        test('should reject invalid email', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'Password123',
                username: 'testuser'
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(invalidData);


            expect(response.status).toBe(400);
            expect(response.body.error).toContain('email doit être valide');
        });

        test('should reject weak password', async () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'weak',
                username: 'testuser'
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('minuscule, une majuscule et un chiffre');
        });

        test('should reject invalid username', async () => {
            const invalidData = {
                email: 'test@example.com',
                password: 'Password123',
                username: 'test@user!' // Invalid characters
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('lettres et des chiffres');
        });

        test('should reject missing required fields', async () => {
            const incompleteData = {
                email: 'test@example.com'
                // Missing password and username
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(incompleteData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('requis');
        });
    });

    describe('User Login Validation', () => {
        test('should accept valid login data', async () => {
            const validData = {
                email: 'test@example.com',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/test/user/login')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject invalid email format', async () => {
            const invalidData = {
                email: 'not-an-email',
                password: 'Password123'
            };

            const response = await request(app)
                .post('/test/user/login')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('email doit être valide');
        });

        test('should reject missing password', async () => {
            const invalidData = {
                email: 'test@example.com'
                // Missing password
            };

            const response = await request(app)
                .post('/test/user/login')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Mot de passe requis');
        });
    });

    describe('Password Reset Validation', () => {
        test('should accept valid email', async () => {
            const validData = {
                email: 'test@example.com'
            };

            const response = await request(app)
                .post('/test/user/reset-password')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject invalid email', async () => {
            const invalidData = {
                email: 'invalid-email'
            };

            const response = await request(app)
                .post('/test/user/reset-password')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('email doit être valide');
        });
    });

    describe('Password Change Validation', () => {
        test('should accept valid password change data', async () => {
            const validData = {
                email: 'test@example.com',
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword456'
            };

            const response = await request(app)
                .post('/test/user/change-password')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject weak new password', async () => {
            const invalidData = {
                email: 'test@example.com',
                oldPassword: 'OldPassword123',
                newPassword: 'weak'
            };

            const response = await request(app)
                .post('/test/user/change-password')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('minuscule, une majuscule et un chiffre');
        });
    });

    describe('Quiz Creation Validation', () => {
        test('should accept valid quiz data', async () => {
            const validData = {
                title: 'My Quiz Title',
                content: 'This is the quiz content with questions and answers.'
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject empty title', async () => {
            const invalidData = {
                title: '',
                content: 'Valid content'
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Titre requis');
        });

        test('should reject title that is too long', async () => {
            const invalidData = {
                title: 'A'.repeat(150), // Exceeds 100 character limit
                content: 'Valid content'
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('100 caractères');
        });

        test('should reject empty content', async () => {
            const invalidData = {
                title: 'Valid Title',
                content: ''
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Contenu requis');
        });

        test('should reject content that is too long', async () => {
            const invalidData = {
                title: 'Valid Title',
                content: 'A'.repeat(50001) // Exceeds 50000 character limit
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('50000 caractères');
        });
    });

    describe('Quiz Update Validation', () => {
        test('should accept valid quiz update data', async () => {
            const validData = {
                title: 'Updated Quiz Title',
                content: 'Updated quiz content.'
            };

            const response = await request(app)
                .put('/test/quiz/update')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should accept partial update (title only)', async () => {
            const validData = {
                title: 'Updated Title Only'
            };

            const response = await request(app)
                .put('/test/quiz/update')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should accept partial update (content only)', async () => {
            const validData = {
                content: 'Updated content only'
            };

            const response = await request(app)
                .put('/test/quiz/update')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject invalid title in update', async () => {
            const invalidData = {
                title: 'A'.repeat(150) // Too long
            };

            const response = await request(app)
                .put('/test/quiz/update')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('100 caractères');
        });
    });

    describe('Folder Creation Validation', () => {
        test('should accept valid folder data', async () => {
            const validData = {
                title: 'My Folder'
            };

            const response = await request(app)
                .post('/test/folder/create')
                .send(validData);

            expect(response.status).toBe(200);
        });

        test('should reject empty title', async () => {
            const invalidData = {
                title: ''
            };

            const response = await request(app)
                .post('/test/folder/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Titre requis');
        });

        test('should reject title that is too long', async () => {
            const invalidData = {
                title: 'A'.repeat(150) // Exceeds 100 character limit
            };

            const response = await request(app)
                .post('/test/folder/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('100 caractères');
        });

        test('should reject missing title', async () => {
            const invalidData = {};

            const response = await request(app)
                .post('/test/folder/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Titre requis');
        });
    });

    describe('Multiple Validation Errors', () => {
        test('should return multiple validation errors for user registration', async () => {
            const invalidData = {
                email: 'invalid-email',
                password: 'weak',
                username: 'invalid@user'
            };

            const response = await request(app)
                .post('/test/user/register')
                .send(invalidData);

            expect(response.status).toBe(400);
            const errorMessage = response.body.error;
            expect(errorMessage).toContain('email doit être valide');
            expect(errorMessage).toContain('minuscule, une majuscule et un chiffre');
            expect(errorMessage).toContain('lettres et des chiffres');
        });

        test('should return multiple validation errors for quiz creation', async () => {
            const invalidData = {
                title: 'A'.repeat(150), // Too long
                content: '' // Empty
            };

            const response = await request(app)
                .post('/test/quiz/create')
                .send(invalidData);

            expect(response.status).toBe(400);
            const errorMessage = response.body.error;
            expect(errorMessage).toContain('100 caractères');
            expect(errorMessage).toContain('Contenu requis');
        });
    });
});