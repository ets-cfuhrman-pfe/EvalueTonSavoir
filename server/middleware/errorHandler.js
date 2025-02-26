const AppError = require("./AppError");
const fs = require('fs');

const errorHandler = (error, req, res, _next) => {
    res.setHeader('Cache-Control', 'no-store');
  
    // Debug 
    console.log("Erreur reçue :", {
      message: error.message,
      stack: error.stack,
      constructor: error.constructor.name,
      proto: Object.getPrototypeOf(error)
    });
  
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

const logError = (error) => {
    const time = new Date();
    var log_file = fs.createWriteStream(__dirname + '/../debug.log', {flags : 'a'});
    log_file.write(time + '\n' + error + '\n\n');
}

module.exports = errorHandler;
