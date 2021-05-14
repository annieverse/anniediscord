const privilege = require(`../config/permissions`)
/**
 * Fetch user's permission level
 * @param {object} [message={}] Target message's instance.
 * @param {string} [userId=``] Target user.
 * @returns {object}
 */
module.exports = (message={}, userId={}) => {
    // Check for developer privileges
    if (privilege[4].accounts.includes(userId)) return privilege[4]
    // User without developer privileges in dm interface will be automatically assigned as a regular user.
    if (message.channel.type === `dm`) return privilege[0]
    const member = message.member
    const descendingPrivileges = Object.keys(privilege).sort((a, b) => b - a)
    for (let i=0; i<descendingPrivileges.length; i++) {
        const pvObj = privilege[descendingPrivileges[i]]
        if (pvObj.level === 4) continue
        if (member.hasPermission(pvObj.permissionString)) return pvObj
    }
    // Returns as regular user if no level is matched
    return privilege[0]
}
