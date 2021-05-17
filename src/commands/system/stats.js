const memUsage = require(`../../utils/memoryUsage`)
const Command = require(`../../libs/commands`)
const pkg = require(`../../../package`)
const shardName = require(`../../config/shardName`)
const ms = require(`ms`)
const commanifier = require(`../../utils/commanifier`)
/**
 * Gives info about the current bot performance.
 * @author klerikdust
 */
class SystemStatus extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
		super(Stacks)
	}

    /**
     * Running command workflow
     * @return {void}
     */
	async execute() {
		const { total } = await this.bot.db.getTotalCommandUsage()
		return this.reply(this.locale.SYSTEM_STATS.DISPLAY, {
			header: `The State of Annie`,
			thumbnail: this.bot.user.displayAvatarURL(),
			socket: {
                shard: shardName[this.message.guild.shard.id],
                ping: commanifier(this.bot.ws.ping),
                uptime: ms(this.bot.uptime, {long:true}),
                memory: this.formatBytes(memUsage()),
                totalCommands: commanifier(total),
                version: pkg.version,
                servers: commanifier((await this.bot.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0)),
                emoji: await this.bot.getEmoji(`AnnieNyaa`)
			}
		})
	}

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

module.exports.help = {
	start: SystemStatus,
	name: `stats`,
	aliases: [`stats`, `botinfo`, `annieinfo`, `info`, `anniestatus`],
	description: `Gives info about the current Annie's Statistic.`,
	usage: `stats`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}
