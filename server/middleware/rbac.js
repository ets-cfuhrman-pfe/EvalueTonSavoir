const Permissions = require('../models/permissions');
const AppError = require("./AppError");
const { UNAUTHORIZED_PERMISSION_MISSING} = require("../constants/errorCodes");

class Rbac {
    checkPermission = (...permissions) => {
        return (req, res, next) => {
            let userRole;
            if (req.user) {
                userRole = req.user.role;
            } else if (req.session.passport.user) {
                userRole = req.session.passport.user.role;
            } else {
                userRole = 'anonymous';
            }
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