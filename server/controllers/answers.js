const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, ANSWER_NOT_FOUND } = require('../constants/errorCodes.js');

class AnswersController {
    constructor(answersModel) {
        this.answers = answersModel;
    }

    create = async (req, res, next) => {
        try {
            const { answerText, showFeedback, points, goodAnswer } = req.body;

            if (!answerText || typeof showFeedback !== 'boolean' || typeof points !== 'number'|| typeof goodAnswer !== 'boolean') {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = this.answers.create(answerText, showFeedback, points, goodAnswer);

            return res.status(200).json({
                message: 'Answer created successfully.',
                answer: result
            });

        } catch (error) {
            return next(error);
        }
    };

    get = async (req, res, next) => {
        try {
            const { answerId } = req.params;

            if (!answerId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const answer = this.answers.get(parseInt(answerId));

            if (!answer) {
                throw new AppError(ANSWER_NOT_FOUND);
            }

            return res.status(200).json(answer);

        } catch (error) {
            return next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { answerId } = req.params;

            if (!answerId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = this.answers.delete(parseInt(answerId));

            if (!result) {
                throw new AppError(ANSWER_NOT_FOUND);
            }

            return res.status(200).json({
                message: 'Answer deleted successfully.'
            });

        } catch (error) {
            return next(error);
        }
    };
}

module.exports = AnswersController;