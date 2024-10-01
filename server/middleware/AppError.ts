interface ErrorCode {
    message: string;
    code: number;
}

class AppError extends Error {
    statusCode: number;

    constructor(errorCode: ErrorCode) {
        super(errorCode.message);
        this.statusCode = errorCode.code;
        Object.setPrototypeOf(this, AppError.prototype); // Ensure the prototype chain is correctly set
    }
}

export default AppError;
