const Role = require('../models/role');

class Permissions {
    constructor() {
        this.permissions = [];
    }

    getPermissionsByRoleName(roleName) {
        const role = Role.getRoleByName(roleName);
        return role ? role.permissions : [];
    }
}
module.exports = new Permissions;