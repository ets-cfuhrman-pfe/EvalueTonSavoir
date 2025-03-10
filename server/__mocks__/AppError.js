class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode || 500;
  
      Object.setPrototypeOf(this, new.target.prototype);
  
      Error.captureStackTrace(this, this.constructor);
    }
  }
module.exports = AppError;
