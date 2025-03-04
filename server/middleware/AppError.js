class AppError extends Error {
    constructor (errorCode) {
      super(errorCode.message);
      this.statusCode = errorCode.code;
      this.isOperational = true; 
    }
  }
  
  module.exports = AppError;
  