const Permissions = require('../models/permissions');
const AppError = require("./AppError");
const { UNAUTHORIZED_PERMISSION_MISSING} = require("../constants/errorCodes");
const jwt = require("jsonwebtoken");

class Rbac {
    checkPermission = (...permissions) => {
        return (req, res, next) => {
            const userRole = req.user ? req.user.role : 'anonymous';
            const userPermissions = Permissions.getPermissionsByRoleName(userRole);

            for (let permission of permissions) {
                if (!userPermissions.includes(permission)) {
                    return next(new AppError(UNAUTHORIZED_PERMISSION_MISSING));
                }
            }

            return next();
        };
    };
}

module.exports = new Rbac;