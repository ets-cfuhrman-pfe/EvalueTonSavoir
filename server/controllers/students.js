const AppError = require('../middleware/AppError.js');
const { MISSING_REQUIRED_PARAMETER, STUDENT_NOT_FOUND, STUDENT_ALREADY_EXISTS } = require('../constants/errorCodes.js');

class StudentsController {
    constructor(studentModel) {
        this.students = studentModel;
    }

    create = async (req, res, next) => {
        try {
            const { name, answers } = req.body;

            if (!name || !Array.isArray(answers)) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const existingStudent = await this.students.findByName(name);
            if (existingStudent) {
                throw new AppError(STUDENT_ALREADY_EXISTS);
            }

            const result = await this.students.create(name, answers);

            if (!result) {
                throw new AppError(STUDENT_ALREADY_EXISTS);
            }

            return res.status(200).json({
                message: 'Student created successfully.'
            });

        } catch (error) {
            return next(error);
        }
    };

    get = async (req, res, next) => {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const student = await this.students.get(studentId);

            if (!student) {
                throw new AppError(STUDENT_NOT_FOUND);
            }

            return res.status(200).json(student);

        } catch (error) {
            return next(error);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { studentId } = req.params;

            if (!studentId) {
                throw new AppError(MISSING_REQUIRED_PARAMETER);
            }

            const result = await this.students.delete(studentId);

            if (!result) {
                throw new AppError(STUDENT_NOT_FOUND);
            }

            return res.status(200).json({
                message: 'Student deleted successfully.'
            });

        } catch (error) {
            return next(error);
        }
    };
}

module.exports = StudentsController;