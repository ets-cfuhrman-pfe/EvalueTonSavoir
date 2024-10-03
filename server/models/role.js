const roles = require('../config/roles.json');

class Role {
    constructor() {
        this.roles = roles.roles;
    }

    getRoleByName(name) {
        return this.convertCrud(this.roles.find((role) => role.name === name));
    }

    getRoles() {
        return this.roles;
    }

    convertCrud(role) {
        for (let permission of role.permissions) {
            if (permission.startsWith("crud")) {
                let resourceName = permission.split("_");
                role.permissions.push("create_" + resourceName[1]);
                role.permissions.push("read_" + resourceName[1]);
                role.permissions.push("update_" + resourceName[1]);
                role.permissions.push("delete_" + resourceName[1]);
            }
        }
        return role;
    }
}

module.exports = new Role;