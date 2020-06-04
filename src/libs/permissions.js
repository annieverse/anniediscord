const config = require(`../config/permissions`)
const { Permissions } = require(`discord.js`)

class PermissionController {
    constructor(message={}) {
        this.message = message
    }

    /**
     * Fetch user's permission level
     * @param {string} [userId=this.message.author.id] Target user's id permission to be fetched from
     * @returns {configObject}
     */
    getUserPermission(userId=this.message.author.id) {
        // Check for developer privileges
        if (config.developer.accounts.includes(userId)) return config.developer
        // User without developer privileges in dm interface will be automatically assigned as a regular user.
        if (this.message.channel.type === `dm`) return config.user

        const perm = new Permissions(this._getUser(userId).highestRole.permissions)
        for (let type in config) {
            if (type === `developer`) continue
            if (perm.has(config[type].permissionString)) {
                return config[type]
            }
        }
        // Returns as regular user if no level is matched
        return config.user
    }

    _getUser(userId=``) {
        return this.message.guild.members.get(userId)
    }
}

module.exports = PermissionController