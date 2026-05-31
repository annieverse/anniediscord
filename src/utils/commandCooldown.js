"use strict"
const { cooldown } = require(`../config/commands`)

/**
 * Read a command cooldown without mutating it.
 *
 * @param {object} client Discord client.
 * @param {string} commandName Resolved canonical command name.
 * @param {string} userId Invoking user ID.
 * @param {string} guildId Guild ID.
 * @return {{ active: boolean, diff: number, instanceId: string }}
 */
function readCommandCooldown(client, commandName, userId, guildId) {
	const instanceId = `CMD_${commandName.toUpperCase()}_${userId}@${guildId}`
	const userCooldown = client.cooldowns.get(instanceId)
	if (!userCooldown) return { active: false, diff: 0, instanceId }
	const diff = cooldown - ((Date.now() - userCooldown) / 1000)
	return { active: diff > 0, diff, instanceId }
}

/**
 * Start a command cooldown and return a rollback function for pre-execution exits.
 *
 * @param {object} client Discord client.
 * @param {string} instanceId Cooldown cache key.
 * @return {Function}
 */
function startCommandCooldown(client, instanceId) {
	const startedAt = Date.now()
	client.cooldowns.set(instanceId, startedAt)
	return function clearPendingCommandCooldown() {
		if (client.cooldowns.get(instanceId) === startedAt) client.cooldowns.delete(instanceId)
	}
}

/**
 * Send the same localized cooldown response used by the command controllers.
 *
 * @param {object} client Discord client.
 * @param {object} target Message or interaction.
 * @param {string} userId Invoking user ID.
 * @param {string} username Invoking username.
 * @param {number} diff Seconds remaining.
 * @return {Promise<void>}
 */
async function sendCommandCooldown(client, target, userId, username, diff) {
	const userData = await client.db.userUtils.getUserLocale(userId)
	client.localization.lang = userData.lang
	const locale = (key) => client.localization.findLocale(key, userData.lang)
	const reply = client.responseLibs(target, false, locale)
	return reply.send(locale(`COMMAND.STILL_COOLDOWN`), {
		socket: {
			emoji: await client.getEmoji(`AnnieYandereAnim`),
			user: username,
			timeLeft: diff.toFixed(1)
		}
	})
}

module.exports = {
	readCommandCooldown,
	sendCommandCooldown,
	startCommandCooldown
}
