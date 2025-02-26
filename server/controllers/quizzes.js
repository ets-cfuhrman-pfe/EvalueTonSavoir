const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, QUIZ_NOT_FOUND } = require('../constants/errorCodes.js');

class QuizController {
    constructor(quizModel) {
        this.quizzes = quizModel;
    }

    create = async (req, res, next) => {
        try {
            const { students, questionnaire } = req.body;

            if (!students || !questionnaire) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = this.quizzes.create(students, questionnaire);

            return res.status(200).json({
                message: 'Quiz created successfully.',
                quiz: result
            });

        } catch (error) {
            return next(error);
        }
    };

    get = async (req, res, next) => {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const quiz = this.quizzes.get(parseInt(quizId));

            if (!quiz) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            return res.status(200).json(quiz);

        } catch (error) {
            return next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { quizId } = req.params;

            if (!quizId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = this.quizzes.delete(parseInt(quizId));

            if (!result) {
                throw new AppError(QUIZ_NOT_FOUND);
            }

            return res.status(200).json({
                message: 'Quiz deleted successfully.'
            });

        } catch (error) {
            return next(error);
        }
    };
}

module.exports = QuizController;