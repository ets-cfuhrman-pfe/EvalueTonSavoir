import { HttpStatusCode } from "../utils/http-status-codes"

export type AppErrorInfos = {
    message:string
    statusCode:number|HttpStatusCode
}

export default class AppError extends Error {
    statusCode:number
    constructor (infos:AppErrorInfos) {
        super(infos.message)
        this.statusCode = infos.statusCode
    }
}
