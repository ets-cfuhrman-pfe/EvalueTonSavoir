
export type LabelMap = { [key: string]: string };

export interface AdminTableType {
    _id: string;
    email: string;
    title: string;
    created_at: Date;
    updated_at: Date;
    name: string;
    roles: string[];
}