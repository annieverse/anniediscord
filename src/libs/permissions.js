const config = require(`../config/permissions`)
/**
 * Fetch user's permission level
 * @param {object} [message={}] Target message's instance.
 * @param {string} [userId=``] Target user.
 * @returns {object}
 */
module.exports = (message={}, userId={}) => {
    // Check for developer privileges
    if (config[4].accounts.includes(userId)) return config[4]
    // User without developer privileges in dm interface will be automatically assigned as a regular user.
    if (this.message.channel.type === `dm`) return config[0]
    const member = message.guild.members.cache.get(userId)
    for (let privilege in config) {
        if (privilege.level === 4) continue
        if (member.hasPermission(privilege.permissionString)) {
            return config[privilege.level]
        }
    }
    // Returns as regular user if no level is matched
    return config[0]
}
