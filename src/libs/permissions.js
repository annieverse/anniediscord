const privilege = require(`../config/permissions`)
const logger = require(`./logger`)
/**
 * Fetch user's permission level
 * @param {object} [message={}] Target message's instance.
 * @param {string} [userId=``] Target user.
 * @returns {object}
 */
module.exports = async (message={}, userId={}) => {
    const instanceId = `[Permissions][${userId}@${message.guild ? message.guild.id : `DM`}]`
    // Check for developer privileges
    if (privilege[4].accounts.includes(userId)) {
        logger.debug(`${instanceId} assigned as developer`)
        return privilege[4]
    }
    // User without developer privileges in dm interface will be automatically assigned as a regular user.
    if (message.channel.type === `dm`) {
        logger.debug(`${instanceId} assigned as regular user`)
        return privilege[0]
    }
    const member = await message.guild.members.fetch(userId)
    const descendingPrivileges = Object.keys(privilege).sort((a, b) => b - a)
    for (let i=0; i<descendingPrivileges.length; i++) {
        const pvObj = privilege[descendingPrivileges[i]]
        if (pvObj.level === 4) continue
        if (member.hasPermission(pvObj.permissionString)) {
            logger.debug(`${instanceId} assigned as ${pvObj.name}`)
            return pvObj
        }
    }
    // Returns as regular user if no level is matched
    logger.debug(`${instanceId} fallback as regular user`)
    return privilege[0]
}
