export interface QuizType {
    _id: string;
    folderId: string;
    folderName: string;
    userId: string;
    title: string;
    content: string[];
    roomId: string;
    created_at: Date;
    updated_at: Date;
}
