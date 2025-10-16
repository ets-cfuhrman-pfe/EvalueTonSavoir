import axios, { AxiosError, AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';
import { ENV_VARIABLES } from '../constants';

import { FolderType } from 'src/Types/FolderType';
import { ImagesResponse, ImagesParams } from '../Types/Images';
import { QuizType } from 'src/Types/QuizType';
import { RoomType } from 'src/Types/RoomType';

type ApiResponse = boolean | string;

class ApiService {
    private BASE_URL: string;
    private TTL: number;

    constructor() {
        this.BASE_URL = ENV_VARIABLES.VITE_BACKEND_URL;
        this.TTL = 3600000; // 1h
    }

    private constructRequestUrl(endpoint: string): string {
        return `${this.BASE_URL}/api${endpoint}`;
    }

    private constructRequestHeaders() {
        if (this.isLoggedIn()) {
            return {
                Authorization: `Bearer ${this.getToken()}`,
                'Content-Type': 'application/json'
            };
        }
        else {
            return {
                'Content-Type': 'application/json'
            };
        }
    }

    // Helpers
    public saveToken(token: string): void {
        const now = new Date();

        const object = {
            token: token,
            expiry: now.getTime() + this.TTL
        }

        localStorage.setItem("jwt", JSON.stringify(object));
    }

    private getToken(): string | null {
        const objectStr = localStorage.getItem("jwt");

        if (!objectStr) {
            return null
        }

        const object = JSON.parse(objectStr)
        const now = new Date()

        if (now.getTime() > object.expiry) {
            // If the item is expired, delete the item from storage
            // and return null
            this.logout();
            return null
        }

        return object.token;
    }

    public isLoggedIn(): boolean {
        const token = this.getToken()

        if (token == null) {
            return false;
        }

        // Update token expiry
        this.saveToken(token);

        return true;
    }

    public isLoggedInTeacher(): boolean {
        const token = this.getToken();


        if (token == null) {
            return false;
        }

        try {
            const decodedToken = jwtDecode(token) as { roles: string[] };

            /////// REMOVE BELOW
            // automatically add teacher role if not present
            if (!decodedToken.roles.includes('teacher')) {
                decodedToken.roles.push('teacher');
            }
            ////// REMOVE ABOVE
            const userRoles = decodedToken.roles;
            const requiredRole = 'teacher';

            if (!userRoles || !userRoles.includes(requiredRole)) {
                return false;
            }

            // Update token expiry
            this.saveToken(token);

            return true;
        } catch (error) {
            console.error("Error decoding token:", error);
            return false;
        }
    }

    public saveUsername(username: string): void {
        if (!username || username.length === 0) {
            return;
        }

        const object = {
            username: username
        }

        localStorage.setItem("username", JSON.stringify(object));
    }

    public getUsername(): string {
        const objectStr = localStorage.getItem("username");
        
        if (!objectStr) {
            return "";
        }

        const object = JSON.parse(objectStr)

        return object.username;
    }

    public getUserID(): string {
        const token = localStorage.getItem("jwt");
        
        if (!token) {
            return "";
        }

        const jsonObj = jwtDecode(token) as { userId: string };
        
        if (!jsonObj.userId) {
            return "";
        }

        return jsonObj.userId;
    }

    // Route to know if rooms need authentication to join
    public async getRoomsRequireAuth(): Promise<any> {
        const url: string = this.constructRequestUrl(`/auth/getRoomsRequireAuth`);
        const result: AxiosResponse = await axios.get(url);

        if (result.status == 200) {
            return result.data.roomsRequireAuth;
        }
        return false;
    }

    public logout(): void {
        localStorage.removeItem("username");
        return localStorage.removeItem("jwt");
    }

    // User Routes

    /**
     * @returns true if  successful 
     * @returns A error string if unsuccessful,
     */
    public async register(name: string, email: string, password: string, roles: string[]): Promise<any> {
        console.log(`ApiService.register: name: ${name}, email: ${email}, password: ${password}, roles: ${roles}`);
        try {

            if (!email || !password) {
                throw new Error(`L'email et le mot de passe sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/auth/simple-auth/register`);
            const headers = this.constructRequestHeaders();
            const body = { name, email, password, roles };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status == 200) {
                //window.location.href = result.request.responseURL;
                window.location.href = '/login';
            }
            else {
                throw new Error(`La connexion a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

/**
 * @returns true if successful
 * @returns An error string if unsuccessful
 */
public async login(email: string, password: string): Promise<any> {
    console.log(`login: email: ${email}, password: ${password}`);
    try {
        if (!email || !password) {
            throw new Error("L'email et le mot de passe sont requis.");
        }

        const url: string = this.constructRequestUrl(`/auth/simple-auth/login`);
        const headers = this.constructRequestHeaders();
        const body = { email, password };

        console.log(`login: POST ${url} body: ${JSON.stringify(body)}`);
        const result: AxiosResponse = await axios.post(url, body, { headers: headers });
        console.log(`login: result: ${result.status}, ${result.data}`);

        // If login is successful, redirect the user
        if (result.status === 200) {
            //window.location.href = result.request.responseURL;
            this.saveToken(result.data.token);
            this.saveUsername(result.data.username);
            window.location.href = '/teacher/dashboard-v2';
            return true;
        } else {
            throw new Error(`La connexion a échoué. Statut: ${result.status}`);
        }
    } catch (error) {
        console.log("Error details:", error);

        // Handle Axios-specific errors
        if (axios.isAxiosError(error)) {
            const err = error as AxiosError;
            const responseData = err.response?.data as { message?: string } | undefined;

            // If there is a message field in the response, print it
            if (responseData?.message) {
                console.log("Backend error message:", responseData.message);
                return responseData.message;
            }

            // If no message is found, return a fallback message
            return "Erreur serveur inconnue lors de la requête.";
        }

        // Handle other non-Axios errors
        return "Une erreur inattendue s'est produite.";
    }
}


    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async resetPassword(email: string): Promise<ApiResponse> {
        try {

            if (!email) {
                throw new Error(`L'email est requis.`);
            }

            const url: string = this.constructRequestUrl(`/auth/simple-auth/reset-password`);
            const headers = this.constructRequestHeaders();
            const body = { email };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`Échec de la réinitialisation du mot de passe. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if  successful 
     * @returns A error string if unsuccessful,
     */
    public async changePassword(email: string, oldPassword: string, newPassword: string): Promise<ApiResponse> {
        try {

            if (!email || !oldPassword || !newPassword) {
                throw new Error(`L'email, l'ancien et le nouveau mot de passe sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/auth/simple-auth/change-password`);
            const headers = this.constructRequestHeaders();
            const body = { email, oldPassword, newPassword };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`Le changement du mot de passe a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if  successful 
     * @returns A error string if unsuccessful,
     */
    public async deleteUser(email: string, password: string): Promise<ApiResponse> {
        try {

            if (!email || !password) {
                throw new Error(`L'email et le mot de passe sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/user/delete-user`);
            const headers = this.constructRequestHeaders();
            const body = { email, password };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La suppression du compte a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    // Folder Routes

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async createFolder(title: string): Promise<ApiResponse> {
        try {

            if (!title) {
                throw new Error(`Le titre est requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/create`);
            const headers = this.constructRequestHeaders();
            const body = { title };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La création du dossier a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { message: string } | undefined;
                return data?.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns folder array if successful 
     * @returns A error string if unsuccessful,
     */
    public async getUserFolders(): Promise<FolderType[] | string> {
        try {

            // No params

            const url: string = this.constructRequestUrl(`/folder/getUserFolders`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention des dossiers utilisateur a échoué. Status: ${result.status}`);
            }

            return result.data.data.map((folder: FolderType) => ({ _id: folder._id, title: folder.title }));

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const url = err.config?.url || 'URL inconnue';
                return data?.error || `Erreur serveur inconnue lors de la requête (${url}).`;
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns quiz array if successful 
     * @returns A error string if unsuccessful,
     */
    public async getFolderContent(folderId: string): Promise<QuizType[] | string> {
        try {

            if (!folderId) {
                throw new Error(`Le folderId est requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/getFolderContent/${folderId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention des quiz du dossier a échoué. Status: ${result.status}`);
            }

            return result.data.data.map((quiz: QuizType) => ({ _id: quiz._id, title: quiz.title, content: quiz.content }));

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async deleteFolder(folderId: string): Promise<ApiResponse> {
        try {

            if (!folderId) {
                throw new Error(`Le folderId est requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/delete/${folderId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.delete(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La supression du dossier a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { message: string } | undefined;
                return data?.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async renameFolder(folderId: string, newTitle: string): Promise<ApiResponse> {
        try {
            console.log(`rename folder: folderId: ${folderId}, newTitle: ${newTitle}`);
            if (!folderId || !newTitle) {
                throw new Error(`Le folderId et le nouveau titre sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/rename`);
            const headers = this.constructRequestHeaders();
            const body = { folderId, newTitle };

            const result = await axios.put(url, body, { headers: headers });

            console.log(`rename folder: result: ${result.status}, ${result.data}`);
            if (result.status !== 200) {
                throw new Error(`Le changement de nom de dossier a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                console.log(JSON.stringify(err));
                const data = err.response?.data as { message: string } | undefined;
                return data?.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    public async duplicateFolder(folderId: string): Promise<ApiResponse> {
        try {
            if (!folderId) {
                throw new Error(`Le folderId et le nouveau titre sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/duplicate`);
            const headers = this.constructRequestHeaders();
            const body = { folderId };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La duplication du dossier a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { message: string } | undefined;
                return data?.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    public async copyFolder(folderId: string, newTitle: string): Promise<ApiResponse> {
        try {
            if (!folderId || !newTitle) {
                throw new Error(`Le folderId et le nouveau titre sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/folder/copy/${folderId}`);
            const headers = this.constructRequestHeaders();
            const body = { newTitle };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La copie du dossier a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { message: string } | undefined;
                return data?.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    // Quiz Routes

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async createQuiz(title: string, content: string[], folderId: string): Promise<ApiResponse> {
        try {

            if (!title || !content || !folderId) {
                throw new Error(`Le titre, les contenu et le dossier de destination sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/create`);
            const headers = this.constructRequestHeaders();
            const body = { title, content, folderId };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La création du quiz a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns quiz if successful 
     * @returns A error string if unsuccessful,
     */
    public async getQuiz(quizId: string): Promise<QuizType | string> {
        try {

            if (!quizId) {
                throw new Error(`Le quizId est requis.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/get/${quizId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention du quiz a échoué. Status: ${result.status}`);
            }

            return result.data.data as QuizType;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async deleteQuiz(quizId: string): Promise<ApiResponse> {
        try {

            if (!quizId) {
                throw new Error(`Le quizId est requis.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/delete/${quizId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.delete(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La suppression du quiz a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                return error.message || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async updateQuiz(quizId: string, newTitle: string, newContent: string[]): Promise<ApiResponse> {
        try {

            if (!quizId || !newTitle || !newContent) {
                throw new Error(`Le quizId, titre et le contenu sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/update`);
            const headers = this.constructRequestHeaders();
            const body = { quizId, newTitle, newContent };

            const result: AxiosResponse = await axios.put(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`La mise à jours du quiz a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async moveQuiz(quizId: string, newFolderId: string): Promise<ApiResponse> {
        try {

            if (!quizId || !newFolderId) {
                throw new Error(`Le quizId et le nouveau dossier sont requis.`);
            }
            //console.log(quizId);
            const url: string = this.constructRequestUrl(`/quiz/move`);
            const headers = this.constructRequestHeaders();
            const body = { quizId, newFolderId };

            const result: AxiosResponse = await axios.put(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`Le déplacement du quiz a échoué. Status: ${result.status}`);
            }

            return true;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    /**
     * @remarks This function is not yet implemented.
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async duplicateQuiz(quizId: string): Promise<ApiResponse> {


        const url: string = this.constructRequestUrl(`/quiz/duplicate`);
        const headers = this.constructRequestHeaders();
        const body = { quizId };

        try {
            const result: AxiosResponse = await axios.post(url, body, { headers });

            if (result.status !== 200) {
                throw new Error(`La duplication du quiz a échoué. Status: ${result.status}`);
            }

            return result.status === 200;
        } catch (error) {
            console.error("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`;
        }

    }

    /**
     * @remarks This function is not yet implemented.
     * @returns true if successful 
     * @returns A error string if unsuccessful,
     */
    public async copyQuiz(quizId: string, newTitle: string, folderId: string): Promise<ApiResponse> {
        try {
            console.log(quizId, newTitle, folderId);
            return "Route not implemented yet!";

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    async getSharedQuiz(quizId: string): Promise<string> {
        try {
            if (!quizId) {
                throw new Error(`quizId is required.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/getShare/${quizId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`Update and share quiz failed. Status: ${result.status}`);
            }

            return result.data.data;
        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Unknown server error during request.';
            }

            return `An unexpected error occurred.`;
        }
    }

    async receiveSharedQuiz(quizId: string, folderId: string): Promise<ApiResponse> {
        try {
            if (!quizId || !folderId) {
                throw new Error(`quizId and folderId are required.`);
            }

            const url: string = this.constructRequestUrl(`/quiz/receiveShare`);
            const headers = this.constructRequestHeaders();
            const body = { quizId, folderId };

            const result: AxiosResponse = await axios.post(url, body, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`Receive shared quiz failed. Status: ${result.status}`);
            }

            return true;
        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Unknown server error during request.';
            }

            return `An unexpected error occurred.`;
        }
    }

    //ROOM routes

    public async getUserRooms(): Promise<RoomType[] | string> {
        try {
            const url: string = this.constructRequestUrl(`/room/getUserRooms`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention des salles utilisateur a échoué. Status: ${result.status}`);
            }

            return result.data.data.map((room: RoomType) => ({ _id: room._id, title: room.title }));

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const url = err.config?.url || 'URL inconnue';
                return data?.error || `Erreur serveur inconnue lors de la requête (${url}).`;
            }

            return `Une erreur inattendue s'est produite.`
        }
    }

    public async getRoomContent(roomId: string): Promise<RoomType> {
        try {
          const url = this.constructRequestUrl(`/room/${roomId}`);
          const headers = this.constructRequestHeaders();

          const response = await axios.get<{ data: RoomType }>(url, { headers });

          if (response.status !== 200) {
            throw new Error(`Failed to get room: ${response.status}`);
          }

          return response.data.data;

        } catch (error) {
          if (axios.isAxiosError(error)) {
            const serverError = error.response?.data?.error;
            throw new Error(serverError || 'Erreur serveur inconnue');
          }
          throw new Error('Erreur réseau');
        }
      }

    public async getRoomTitleByUserId(userId: string): Promise<string[] | string> {
        try {
            if (!userId) {
                throw new Error(`L'ID utilisateur est requis.`);
            }

            const url: string = this.constructRequestUrl(`/room/getRoomTitleByUserId/${userId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention des titres des salles a échoué. Status: ${result.status}`);
            }

            return result.data.titles;
        } catch (error) {
            console.log("Error details: ", error);
            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }
            return `Une erreur inattendue s'est produite.`;
        }
    }
    public async getRoomTitle(roomId: string): Promise<string | string> {
        try {
            if (!roomId) {
                throw new Error(`L'ID de la salle est requis.`);
            }

            const url: string = this.constructRequestUrl(`/room/getRoomTitle/${roomId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.get(url, { headers });

            if (result.status !== 200) {
                throw new Error(`L'obtention du titre de la salle a échoué. Status: ${result.status}`);
            }

            return result.data.title;
        } catch (error) {
            console.log("Error details: ", error);
            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la requête.';
            }
            return `Une erreur inattendue s'est produite.`;
        }
    }
    public async createRoom(title: string): Promise<string> {
        try {
            if (!title) {
                throw new Error("Le titre de la salle est requis.");
            }

            const url: string = this.constructRequestUrl(`/room/create`);
            const headers = this.constructRequestHeaders();
            const body = { title };

            const result = await axios.post<{ roomId: string }>(url, body, { headers });
            return `Salle créée avec succès. ID de la salle: ${result.data.roomId}`;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;

                const serverMessage = (err.response?.data as { message?: string })?.message 
                    || (err.response?.data as { error?: string })?.error
                    || err.message;

                if (err.response?.status === 409) {
                    throw new Error(serverMessage);
                }

                throw new Error(serverMessage || "Erreur serveur inconnue");
            }
            throw error;
        }
    }

    public async deleteRoom(roomId: string): Promise<string | string> {
        try {
            if (!roomId) {
                throw new Error(`L'ID de la salle est requis.`);
            }

            const url: string = this.constructRequestUrl(`/room/delete/${roomId}`);
            const headers = this.constructRequestHeaders();

            const result: AxiosResponse = await axios.delete(url, { headers });

            if (result.status !== 200) {
                throw new Error(`La suppression de la salle a échoué. Status: ${result.status}`);
            }

            return `Salle supprimée avec succès.`;
        } catch (error) {
            console.log("Error details: ", error);
            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la suppression de la salle.';
            }
            return `Une erreur inattendue s'est produite.`;
        }
    }

    public async renameRoom(roomId: string, newTitle: string): Promise<string | string> {
        try {
            if (!roomId || !newTitle) {
                throw new Error(`L'ID de la salle et le nouveau titre sont requis.`);
            }

            const url: string = this.constructRequestUrl(`/room/rename`);
            const headers = this.constructRequestHeaders();
            const body = { roomId, newTitle };

            const result: AxiosResponse = await axios.put(url, body, { headers });

            if (result.status !== 200) {
                throw new Error(`La mise à jour du titre de la salle a échoué. Status: ${result.status}`);
            }

            return `Titre de la salle mis à jour avec succès.`;
        } catch (error) {
            console.log("Error details: ", error);
            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                return data?.error || 'Erreur serveur inconnue lors de la mise à jour du titre.';
            }
            return `Une erreur inattendue s'est produite.`;
        }
    }

    // Images Route

    /**
     * @returns the image URL (string) if successful 
     * @returns A error string if unsuccessful,
     */
    public async uploadImage(image: File): Promise<string> {
        try {

            if (!image) {
                throw new Error(`L'image est requise.`);
            }

            const url: string = this.constructRequestUrl(`/image/upload`);

            const headers = {
                Authorization: `Bearer ${this.getToken()}`,
                'Content-Type': 'multipart/form-data'
            };

            const formData = new FormData();
            formData.append('image', image);

            const result: AxiosResponse = await axios.post(url, formData, { headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'enregistrement a échoué. Status: ${result.status}`);
            }

            const id = result.data.id;

            return this.constructRequestUrl('/image/get/' + id);

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const msg = data?.error || 'Erreur serveur inconnue lors de la requête.';
                return `ERROR : ${msg}`;
            }

            return `ERROR : Une erreur inattendue s'est produite.`
        }
    }

    public async getImages(page: number, limit: number): Promise<ImagesResponse> {
        try {
            const url: string = this.constructRequestUrl(`/image/getImages`);
            const headers = this.constructRequestHeaders();
            let params : ImagesParams = { page: page, limit: limit };

            const result: AxiosResponse = await axios.get(url, { params: params, headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'affichage des images a échoué. Status: ${result.status}`);
            }
            const images = result.data;

            return images;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const msg = data?.error || 'Erreur serveur inconnue lors de la requête.';
                throw new Error(`L'enregistrement a échoué. Status: ${msg}`);
            }

            throw new Error(`ERROR : Une erreur inattendue s'est produite.`);
        }
    }

    public async getUserImages(page: number, limit: number): Promise<ImagesResponse> {
        try {
            const url: string = this.constructRequestUrl(`/image/getUserImages`);
            const headers = this.constructRequestHeaders();
            let params : ImagesParams = { page: page, limit: limit };

            const uid = this.getUserID();
            if(uid !== ''){
                params.uid = uid;
            }

            const result: AxiosResponse = await axios.get(url, { params: params, headers: headers });

            if (result.status !== 200) {
                throw new Error(`L'affichage des images de l'utilisateur a échoué. Status: ${result.status}`);
            }
            const images = result.data;

            return images;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const msg = data?.error || 'Erreur serveur inconnue lors de la requête.';
                throw new Error(`L'enregistrement a échoué. Status: ${msg}`);
            }

            throw new Error(`ERROR : Une erreur inattendue s'est produite.`);
        }
    }

    public async deleteImage(imgId: string): Promise<ApiResponse> {
        try {
            const url: string = this.constructRequestUrl(`/image/delete`);
            const headers = this.constructRequestHeaders();
            const uid = this.getUserID();
            let params = { uid: uid, imgId: imgId };

            const result: AxiosResponse = await axios.delete(url, { params: params, headers: headers });

            if (result.status !== 200) {
                throw new Error(`La suppression de l'image a échoué. Status: ${result.status}`);
            }

            const deleted = result.data.deleted;
            return deleted;

        } catch (error) {
            console.log("Error details: ", error);

            if (axios.isAxiosError(error)) {
                const err = error as AxiosError;
                const data = err.response?.data as { error: string } | undefined;
                const msg = data?.error || 'Erreur serveur inconnue lors de la requête.';
                throw new Error(`L'enregistrement a échoué. Status: ${msg}`);
            }

            throw new Error(`ERROR : Une erreur inattendue s'est produite.`);
        }
    }

    public async getAllQuizIds(): Promise<string[]> {
        try {
           const folders = await this.getUserFolders();

           const allQuizIds: string[] = [];

           if (Array.isArray(folders)) {
               for (const folder of folders) {
                   const folderQuizzes = await this.getFolderContent(folder._id);

                   if (Array.isArray(folderQuizzes)) {
                       allQuizIds.push(...folderQuizzes.map(quiz => quiz._id));
                   }
               }
           } else {
               console.error('Failed to get user folders:', folders);
           }

           return allQuizIds;
        } catch (error) {
            console.error('Failed to get all quiz ids:', error);
            throw error;
        }
    }	

   

}

const apiService = new ApiService();
export default apiService;
