const memUsage = require(`../../utils/memoryUsage`)
const pkg = require(`../../../package`)
const shardName = require(`../../config/shardName`)
const ms = require(`ms`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Gives info about the current bot performance.
 * @author klerikdust
 */
module.exports = {
    name: `stats`,
	aliases: [`stats`, `botinfo`, `annieinfo`, `info`, `anniestatus`],
	description: `Gives info about the current Annie's Statistic.`,
	usage: `stats`,
	permissionLevel: 0,
    async execute(client, reply, message, arg, locale) {
		const { total } = await client.db.getTotalCommandUsage()
		return reply.send(locale.SYSTEM_STATS.DISPLAY, {
			header: `The State of Annie`,
			thumbnail: client.user.displayAvatarURL(),
			socket: {
                shard: shardName[message.guild.shard.id],
                ping: commanifier(client.ws.ping),
                uptime: ms(client.uptime, {long:true}),
                memory: this.formatBytes(memUsage()),
                totalCommands: commanifier(total),
                version: pkg.version,
                servers: commanifier((await client.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0)),
                emoji: await client.getEmoji(`AnnieNyaa`)
			}
		})
    },

    /**
	 * Used to format returned bytes value into more human-readable data.
	 * @param {Bytes/Number} bytes 
	 * @param {*} decimals 
	 */
	formatBytes(bytes, decimals = 2) {
		if (bytes === 0) return `0 Bytes`
		const k = 1024
		const dm = decimals < 0 ? 0 : decimals
		const sizes = [`Bytes`, `KB`, `MB`, `GB`, `TB`, `PB`, `EB`, `ZB`, `YB`]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ` ` + sizes[i]
	}
}
