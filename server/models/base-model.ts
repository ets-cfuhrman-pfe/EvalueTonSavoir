import { ObjectId } from "mongodb";

abstract class BaseModel {
    id: ObjectId;
    abstract validate(): boolean;
}

export default BaseModel;