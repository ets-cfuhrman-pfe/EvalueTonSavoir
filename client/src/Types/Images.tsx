export interface Images {
    id: string;
    file_content: string;
    file_name: string;
    mime_type: string;
}

export interface ImagesResponse {
    images: Images[];
    total: number;
}

export interface ImagesParams {
    page: number;
    limit: number;
    uid?: string;
}