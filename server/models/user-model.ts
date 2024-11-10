import BaseModel from './base-model'

export default class User extends BaseModel{
    username:string
    validate(): boolean {
        return true
    }
}