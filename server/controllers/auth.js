const AuthConfig = require('../config/auth.js');

class authController {

    async getActive(req, res, next) {
        try {

            const authC = new AuthConfig();
            authC.loadConfig();

            const authActive = authC.getActiveAuth();

            const response = {
                authActive
            };
            return res.json(response);
        }
        catch (error) {
            return next(error);  // Gérer l'erreur
        }
    }

    async getRoomsRequireAuth(req, res, next) {
        const authC = new AuthConfig();
        const roomsRequireAuth = authC.getRoomsRequireAuth();

        const response = {
            roomsRequireAuth
        }

        return res.json(response);
    }

}

module.exports = new authController;