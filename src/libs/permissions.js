/**
 * Decide target user's permissions level.
 * @param {object} [message={}] Target message's instance.
 * @param {string} [userId=``] Target user.
 * @return {object}
 */
module.exports = (message={}, userId={}) => {
    //  Developer privileges
    if ([`230034968515051520`, `277266191540551680`].includes(userId)) return {
        level: 4,
        name: `Developer`,
        description: `System developer privileges`,
        permissionString: `ADMINISTRATOR`
    }
    // User without developer privileges in dm interface will be automatically assigned as a regular user.
    if (message.channel.type === `dm`) return privilege[0]
    const member = message.member
    //  Server admin
    if (member.hasPermission(`ADMINISTRATOR`)) return {
        level: 3,
        name: `Administrator`,
        description: `Server's super user`
    }
    //  Moderator
    if (member.hasPermission(`MANAGE_ROLES`)) return { 
        level: 2,
        name: `Moderator`,
        description: `Server's manager with moderation capabilities`
    }
    //  If no special privileges are match, fall back to regular-user privilege
    return {
        level: 0,
        name: `User`,
        description: `Regular user`,
    }
}
