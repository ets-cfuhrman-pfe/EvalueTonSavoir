const AppError = require("./AppError");
const fs = require('fs');

const errorHandler = (error, req, res, _next) => {
    res.setHeader('Cache-Control', 'no-store');

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.statusCode
      });
    }

    logError(error.stack);
    return res.status(505).send("Oups! We screwed up big time. 	┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻");
  };

  const logError = (error) => {
    const time = new Date();
    var log_file = fs.createWriteStream(__dirname + '/../debug.log', {flags : 'a'});
    log_file.write(time + '\n' + error + '\n\n');
}

module.exports = errorHandler;
