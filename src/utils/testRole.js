"use strict"

const { PermissionFlagsBits } = require(`discord.js`)
const { roleLower } = require(`./roleCompare`)

/**
 * Test if role can be added to a user.
 * @param {object} client 
 * @param {string} role 
 * @param {string} guild
 * @returns {{result:boolean, roleId:string}}
 */
const testRole = (client, roleObj, guildObj, member) => {
    if (!client) throw Error(`The parameter "client" is mission from function testRole().`)
    if (!roleObj) throw Error(`The parameter "roleObj" is mission from function testRole().`)
    if (!guildObj) throw Error(`The parameter "guildObj" is mission from function testRole().`)
    if (!member) throw Error(`The parameter "member" is mission from function testRole().`)

    if (!member.manageable) return { result: false }
    const gId = client.guilds.resolveId(guildObj)
    const g = client.guilds.cache.get(gId)
    if (!g.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) return { result: false }
    if (!g) return { result: false }
    const roleId = g.roles.resolveId(roleObj)
    if (!g.roles.cache.has(roleId)) return { result: false }
    const role = g.roles.cache.get(roleId)
    if (!role) return { result: false }
    if (role.managed) return { result: false }
    if (!role.editable) return { result: false }

    const highestRole = g.roles.highest
    const result = roleLower(roleId, highestRole, g)

    return { result: result, roleId: role.id }
}


module.exports = testRole