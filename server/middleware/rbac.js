const Permissions = require('../models/permissions');
const AppError = require("./AppError");
const { UNAUTHORIZED_PERMISSION_MISSING} = require("../constants/errorCodes");

class Rbac {
    checkPermission = (...permissions) => {
        return (req, res, next) => {
            let userRole = [];
            if (req.user) {
                userRole = req.user.roles;
            } else if (req.session.passport.user) {
                userRole = req.session.passport.user.roles;
            } else {
                userRole = ['anonymous'];
            }
            let userPermissions = [];
            for (let role of userRole) {
                let userPermissionsTmp = Permissions.getPermissionsByRoleName(role);
                for (let permissionTmp of userPermissionsTmp) {
                    userPermissions.push(permissionTmp);
                }
            }

            const includesAll = (arr, values) => values.every(v => arr.includes(v));

            if (!includesAll(userPermissions, permissions)) {
                return next(new AppError(UNAUTHORIZED_PERMISSION_MISSING));
            }

            return next();
        };
    };
}

module.exports = new Rbac;