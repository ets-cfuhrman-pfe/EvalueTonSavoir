import { User } from "./user";

export class Image {

    constructor(public file_name: string, public file_content: Buffer, public mime_type: string, public owner: User) {
        this.file_name = file_name;
        this.file_content = file_content;
        this.mime_type = mime_type;
        this.owner = owner;
    }

}
