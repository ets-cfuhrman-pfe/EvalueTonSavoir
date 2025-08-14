export interface AdminTableType {
    _id: string;
    email: string;
    created_at: Date;
    updated_at?: Date;
    title?: string;
    name?: string;
    roles?: string[];
}