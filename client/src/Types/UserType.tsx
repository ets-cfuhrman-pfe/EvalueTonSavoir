export interface UserType {
    id: string;
    name: string;
    email: string;
    created_at: string;
    roles: string[];
}

export interface UsersResponse {
    users: UserType[];
}