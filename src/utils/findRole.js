/**
 * Finds a role by id, tag or plain name
 * @param {UserResolvable|string} target the keyword for the role (id, name, mention)
 * @param {Guild} guild
 * @return {object|null}
 */
const findRole = (target, guild) => {
    const fn = `[findRole()]`
    if (!target) throw new TypeError(`${fn} parameter "target" must be filled with target role id/name/mention.`)
    try {
        const rolePattern = /^(?:<@&?)?([0-9]+)>?$/
        if (rolePattern.test(target)) target = target.replace(rolePattern, `$1`)
        const roles = guild.roles.cache
        const filter = role => role.id === target ||
        role.name.toLowerCase() === target.toLowerCase() ||
        role === target
        return roles.filter(filter).first()
    }
    catch(e) {
        return null
    }
}
module.exports = findRole
