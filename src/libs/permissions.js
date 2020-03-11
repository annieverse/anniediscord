const config = require(`../config/permissions`)
const { Permissions } = require(`discord.js`)

class PermissionController {
    constructor(message={}) {
        this.message = message
    }

    /**
     * Fetch user's permission level
     * @since 6.0.0
     * @returns {configObject}
     */
    authorityCheck() {
        // Check for developer privileges
        if (config.developer.accounts.includes(this.message.author.id)) return config.developer
        // User without developer privileges in dm interface will be automatically assigned as a regular user.
        if (this.message.channel.type === `dm`) return config.user

        const perm = new Permissions(this.message.member.highestRole.permissions)
        for (let type in config) {
            if (type === `developer`) continue
            if (perm.has(config[type].permissionString)) {
                return config[type]
            }
        }
        // Returns as regular user if no level is matched
        return config.user
    }
}

module.exports = PermissionController