import Quiz from '../models/quiz-model';
import BaseRepository from './base-repository';

class QuizRepository extends BaseRepository<Quiz> {
  constructor(db) {
    super(db,'quizzes');
  }
}

export default QuizRepository;