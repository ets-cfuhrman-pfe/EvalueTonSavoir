const AppError = require("./AppError");
const fs = require('fs');

const errorHandler = (error, req, res, next) => {
    console.log("ERROR", error);

    if (error instanceof AppError) {
        logError(error);
        return res.status(error.statusCode).json({
            error: error.message
        });
    }

    logError(error.stack);
    return res.status(505).send("Oups! We screwed up big time. 	┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻");
}

const logError = (error) => {
    const time = new Date();
    var log_file = fs.createWriteStream(__dirname + '/../debug.log', {flags : 'a'});
    log_file.write(time + '\n' + error + '\n\n');
}

module.exports = errorHandler;
