import { QuizRepository } from '../repositories/quizRepository';
import { Quiz } from '../models/quiz';

// define a parameter object for the createQuiz method
interface CreateQuizParams {
    title: string;
    content: string;
    folder: Folder;
    user: User;
}

export class QuizService {
    constructor(private quizRepository: QuizRepository) {}

    async createQuiz(params: CreateQuizParams): Promise<Quiz> {
        // Create a new Quiz object without an ID
        const quiz = new Quiz(params.folder, params.user, params.title, params.content);
        
        // Save the quiz to the database, and the repository assigns the ID
        return this.quizRepository.save(quiz);
    }
}
