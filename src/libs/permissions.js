const config = require(`../config/permissions`)
/**
 * Permission Manager.
 * @abstracts
 */
class PermissionController {
    constructor(message={}) {
        /**
         * Message Instance.
         * @type {object}
         */
        this.message = message
    }

    /**
     * Fetch user's permission level
     * @param {string} [userId={}] Target user.
     * @returns {object}
     */
    getUserPermission(userId={}) {
        // Check for developer privileges
        if (config.developer.accounts.includes(userId)) return config.developer
        // User without developer privileges in dm interface will be automatically assigned as a regular user.
        if (this.message.channel.type === `dm`) return config.user
        const member = this.message.guild.members.cache.get(userId)
        for (let type in config) {
            if (type === `developer`) continue
            if (member.hasPermission(config[type].permissionString)) {
                return config[type]
            }
        }
        // Returns as regular user if no level is matched
        return config.user
    }
}

module.exports = PermissionController