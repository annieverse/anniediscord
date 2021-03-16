const moment = require(`moment`)
const memUsage = require(`../../utils/memoryUsage`)
const Command = require(`../../libs/commands`)
const pkg = require(`../../../package`)
const shardName = require(`../../config/shardName`)
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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute() {
		await this.requestUserMetadata(1)
		return this.displayGeneralStatus(...arguments)
	}

	/**
	 * Default response when no additional arg is provided
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 * @returns {reply}
	 */
	async displayGeneralStatus({ reply, commanifier }) {
		const { total } = await this.bot.db.getTotalCommandUsage()
		const uptimeDuration = moment.duration(this.bot.uptime)
		const naph = await this.bot.users.fetch(`230034968515051520`)
		const pan = await this.bot.users.fetch(`277266191540551680`)
		return reply(`Maintained by \`${naph.username}#${naph.discriminator}\` & \`${pan.username}#${pan.discriminator}\`\n\`\`\`\n{{status}}\n\`\`\``, {
			color: `crimson`,
			header: `The State of Annie`,
			thumbnail: this.bot.user.displayAvatarURL(),
			socket: {
				status: `- Cluster				:: ${shardName[this.message.guild.shard.id]}
- Master 				:: v${pkg.version}
- Node.js				:: v${pkg.engines.node}
- Uptime 				:: ${uptimeDuration.days()}d:${uptimeDuration.hours()}h:${uptimeDuration.minutes()}m:${uptimeDuration.seconds()}s
- Memory 				:: ${this.formatBytes(memUsage())}
- Latency				:: ${commanifier(this.bot.ws.ping)}ms
- Commands Ran      	 :: ${commanifier(total)}
- Servers				:: ${commanifier(this.bot.guilds.cache.size)}`
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