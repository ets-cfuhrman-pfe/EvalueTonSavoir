import { MongoClient, Db, ObjectId } from 'mongodb';
import { Quiz } from '../models/quiz';
import QuizRepository from '../repositories/quizRepository';

jest.mock('../repositories/quizRepository');

describe('Quiz Class', () => {
    let connection: MongoClient;
    let db: Db;
    let quizRepository: QuizRepository;

    beforeAll(async () => {
        connection = {
            db: jest.fn().mockReturnThis(),
            collection: jest.fn().mockReturnThis(),
            findOne: jest.fn(),
            insertOne: jest.fn(),
            deleteOne: jest.fn(),
            deleteMany: jest.fn(),
            updateOne: jest.fn(),
        } as unknown as MongoClient;

        db = connection.db();
        quizRepository = new QuizRepository();
        (quizRepository as any).db = { getConnection: () => db };
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new quiz', async () => {
        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const insertedId = new ObjectId();
        jest.spyOn(quizRepository, 'createQuiz').mockResolvedValue(insertedId);

        const result = await quiz.create();

        expect(result).toEqual(insertedId);
        expect(quizRepository.createQuiz).toHaveBeenCalledWith(quiz);
    });

    it('should get the owner of a quiz', async () => {
        const quizId = new ObjectId().toHexString();
        const userId = 'userId';
        jest.spyOn(quizRepository, 'getOwner').mockResolvedValue(userId);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.getOwner(quizId);

        expect(result).toEqual(userId);
        expect(quizRepository.getOwner).toHaveBeenCalledWith(quizId);
    });

    it('should get the content of a quiz', async () => {
        const quizId = new ObjectId().toHexString();
        const content = 'content';
        jest.spyOn(quizRepository, 'getContent').mockResolvedValue(content);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.getContent(quizId);

        expect(result).toEqual(content);
        expect(quizRepository.getContent).toHaveBeenCalledWith(quizId);
    });

    it('should delete a quiz', async () => {
        const quizId = new ObjectId().toHexString();
        jest.spyOn(quizRepository, 'delete').mockResolvedValue(true);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.delete(quizId);

        expect(result).toBe(true);
        expect(quizRepository.delete).toHaveBeenCalledWith(quizId);
    });

    it('should update a quiz', async () => {
        const quizId = new ObjectId().toHexString();
        const updateData = { title: 'new title' };
        jest.spyOn(quizRepository, 'update').mockResolvedValue(true);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.update(quizId, updateData);

        expect(result).toBe(true);
        expect(quizRepository.update).toHaveBeenCalledWith(quizId, updateData);
    });

    it('should move a quiz to a new folder', async () => {
        const quizId = new ObjectId().toHexString();
        const newFolderId = 'newFolderId';
        jest.spyOn(quizRepository, 'move').mockResolvedValue(true);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.move(quizId, newFolderId);

        expect(result).toBe(true);
        expect(quizRepository.move).toHaveBeenCalledWith(quizId, newFolderId);
    });

    it('should duplicate a quiz', async () => {
        const quizId = new ObjectId().toHexString();
        const newQuizId = new ObjectId();
        jest.spyOn(quizRepository, 'duplicate').mockResolvedValue(newQuizId);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.duplicate(quizId);

        expect(result).toEqual(newQuizId);
        expect(quizRepository.duplicate).toHaveBeenCalledWith(quizId);
    });

    it('should check if a quiz exists', async () => {
        const title = 'title';
        const userId = 'userId';
        jest.spyOn(quizRepository, 'quizExists').mockResolvedValue(true);

        const quiz = new Quiz('folderId', 'userId', 'title', 'content', quizRepository);
        const result = await quiz.quizExists(title, userId);

        expect(result).toBe(true);
        expect(quizRepository.quizExists).toHaveBeenCalledWith(title, userId);
    });
});
