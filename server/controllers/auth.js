const AuthConfig = require('../config/auth.js');

class authController {

    async getActive(req, res, next) {
        try {
            const startTime = Date.now();
            
            const authC = new AuthConfig();
            authC.loadConfig();

            const authActive = authC.getActiveAuth();
            
            const operationTime = Date.now() - startTime;

            // Log auth configuration access
            if (req.logAction) {
                req.logAction('auth_config_accessed', {
                    operation: 'getActive',
                    activeAuthMethods: authActive?.length || 0,
                    operationTime: `${operationTime}ms`
                });
            }

            const response = {
                authActive
            };
            return res.json(response);
        }
        catch (error) {
            // Log auth configuration error
            if (req.logSecurity) {
                req.logSecurity('auth_config_error', 'error', {
                    operation: 'getActive',
                    error: error.message
                });
            }
            return next(error);
        }
    }

    async getRoomsRequireAuth(req, res) {
        try {
            const startTime = Date.now();
            
            const authC = new AuthConfig();
            const roomsRequireAuth = authC.getRoomsRequireAuth();
            
            const operationTime = Date.now() - startTime;

            // Log room auth requirements access
            if (req.logAction) {
                req.logAction('room_auth_requirements_accessed', {
                    operation: 'getRoomsRequireAuth',
                    requiresAuth: roomsRequireAuth,
                    operationTime: `${operationTime}ms`
                });
            }

            const response = {
                roomsRequireAuth
            }

            return res.json(response);
        } catch (error) {
            // Log room auth configuration error
            if (req.logSecurity) {
                req.logSecurity('room_auth_config_error', 'error', {
                    operation: 'getRoomsRequireAuth',
                    error: error.message
                });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

}

module.exports = new authController();