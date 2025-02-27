const AppError = require("./AppError");

const errorHandler = (error, req, res, _next) => {
    res.setHeader('Cache-Control', 'no-store');

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.statusCode
      });
    }
  
    return res.status(500).json({
      message: "Erreur technique",
      code: 500
    });
  };

module.exports = errorHandler;
