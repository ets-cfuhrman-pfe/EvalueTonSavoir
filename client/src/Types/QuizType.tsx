// QuizType.tsx
export interface QuizType {
    _id: string;
    folderId: string;
    folderName: string;
    userId: string;
    title: string;
    content: string[];
    created_at: Date;
    updated_at: Date;
}

export interface QuizTypeShort {
    _id: string;
    email: string;
    title: string;
    created_at: Date;
    updated_at: Date;
}

export interface QuizResponse {
    quizzes: QuizTypeShort[];
    total: number;
}