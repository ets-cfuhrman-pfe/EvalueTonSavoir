class AppError extends Error {
    constructor(errorCode = { message: "Something went wrong", code: 500 }) {
        super(errorCode.message);
        this.statusCode = errorCode.code || 500;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;