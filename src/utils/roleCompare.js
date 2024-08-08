"use strict"
const { Guild } = require(`discord.js`)

/**
 * Negative number if the first role's position is lower (second role's is higher) , 0 if equal
 * @param {import("discord.js").RoleResolvable} role1
 * @param {import("discord.js").RoleResolvable} role2
 * @param {Guild} guild
 * @returns {boolean}
 */
const roleLower = (role1, role2, guild) => {
	const test = guild.roles.comparePositions(role1, role2)
	if (test < 0) return true
	return false
}

/**
 * Positive number if the first role's is higher (second role's is lower), 0 if equal
 * @param {import("discord.js").RoleResolvable} role1
 * @param {import("discord.js").RoleResolvable} role2
 * @param {Guild} guild
 * @returns {boolean}
 */
const roleHigher = (role1, role2, guild) => {
	const test = guild.roles.comparePositions(role1, role2)
	if (test > 0) return true
	return false
}

/**
 * Test if a role is between two other roles and return the role if true otherwise return null
 * @param {import("discord.js").RoleResolvable} roleToTest
 * @param {import("discord.js").RoleResolvable} roleStart
 * @param {import("discord.js").RoleResolvable} roleEnd
 * @param {Guild} guild
 * @returns {import("discord.js").RoleResolvable | null}
 */
const compare = (roleToTest, roleStart, roleEnd, guild) => {
	const start = roleLower(roleToTest, roleStart, guild)
	const end = roleHigher(roleToTest, roleEnd, guild)

	if (start && end) return roleToTest
	return null
}

module.exports = {
	roleLower,
	roleHigher,
	compare
}