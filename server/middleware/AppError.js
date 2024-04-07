class AppError extends Error {
    constructor (errorCode) {
        super(errorCode.message)
        this.statusCode = errorCode.code;
    }
}

module.exports = AppError;