import AppError from './AppError'
import fs from 'fs';
import { HttpStatusCode } from '../utils/http-status-codes';

const errorHandler = (error, req, res, next) => {
    console.log("ERROR", error);

    if (error instanceof AppError) {
        logError(error);
        return res.status(error.statusCode).json({
            error: error.message
        });
    }

    logError(error.stack);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).send("Oups! We screwed up big time. 	┻━┻ ︵ヽ(`Д´)ﾉ︵ ┻━┻");
}

const logError = (error) => {
    const time = new Date();
    var log_file = fs.createWriteStream(__dirname + '/../debug.log', {flags : 'a'});
    log_file.write(time + '\n' + error + '\n\n');
}

export default errorHandler
