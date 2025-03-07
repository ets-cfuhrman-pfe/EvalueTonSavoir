import { ENV_VARIABLES } from '../constants';

class AuthService {

    private BASE_URL: string;

    constructor() {
        this.BASE_URL = ENV_VARIABLES.VITE_BACKEND_URL;
    }

    private constructRequestUrl(endpoint: string): string {
        return `${this.BASE_URL}/api${endpoint}`;
    }

    async fetchAuthData(){
        try {
            // console.info(`MODE: ${ENV_VARIABLES.MODE}`);
            // if (ENV_VARIABLES.MODE === 'development') {
            //     return { authActive: true };
            // }
            const response = await fetch(this.constructRequestUrl('/auth/getActiveAuth'));
            const data = await response.json();
            console.log('Data:', JSON.stringify(data));
            return data.authActive;
        } catch (error) {
            console.error('Erreur lors de la récupération des données d\'auth:', error);
        }
    };

}

const authService = new AuthService();
export default authService;
