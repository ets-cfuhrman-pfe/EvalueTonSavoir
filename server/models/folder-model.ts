import BaseModel from './base-model'

export default class Folder extends BaseModel{
    title:string
    validate(): boolean {
        return true
    }
}