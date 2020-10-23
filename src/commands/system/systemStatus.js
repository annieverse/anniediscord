const Card = require(`../../ui/components/cards`)
const Chart = require(`../../ui/components/charts`)
const moment = require(`moment`)
const memUsage = require(`../../utils/memoryUsage`)
const cpuUsage = require(`../../utils/cpuUsage`)
const Command = require(`../../libs/commands`)
const pkg = require(`../../../package`)
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
		this.selectedMetric = `ping` //  default metric
		this.dateThreeshold = 30 // 30 days
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji, trueInt, commanifier, bot:{db, ping, uptime} }) {
		await this.requestUserMetadata(1)

		//  Display regular stats for non-developer
		if (this.message.author.permissions.level < 4 || !this.fullArgs) return this.displayGeneralStatus(...arguments)
		//  Handle user's custom data category
		if (this.args[0]) this.selectedMetric = this.args[0]
		//  Handle user's custom data parameter
		if (this.args[1]) {
			const customDate = trueInt(this.args[1])
			if (!customDate) return reply(this.locale.SYSTEM_STATS.INVALID_DATE, {color: `red`})
			this.dateThreeshold = customDate
		}

		reply(this.locale.COMMAND.FETCHING, {simplified: true, socket: {command: `resource usage`, emoji: emoji(`AAUloading`), user: this.user.id} })
		.then(async loading => {
			const responsesHistory = this.selectedMetric.startsWith(`command`) ? await db.getDailyCommandUsage(this.dateThreeshold) : await db.getResourceData(this.dateThreeshold)
			const history = {
				datasets: responsesHistory.map(data => data[this.selectedMetric]),
				label: responsesHistory.map(data => data.on_date) 
			}
			//  Handle if no data is found for given category
			if (!history.datasets[0]) {
				loading.delete()
				return reply(this.locale.SYSTEM_STATS.NO_DATA_FOUND, {color: `red`, 
					socket: {
						selectedMetric: this.selectedMetric,
						emoji: emoji(`AnnieCry`)
					}
				})
			}

			const uptimeDuration = moment.duration(uptime)
			const liveData = {
				uptime: `${uptimeDuration.days()}d ${uptimeDuration.hours()}h`,
				ping: `${commanifier(ping)} ms`,
				memory: this.formatBytes(memUsage()),
				cpu: `${cpuUsage().toFixed(2)}%`,
				command: history.datasets[0]
			}
			const title = this.selectedMetric.charAt(0).toUpperCase() + this.selectedMetric.slice(1)
			const data = history.datasets
			const percentage = (data[data.length-1]-data[0])/data[0] * 100
			const chartLayer = await new Chart({
				width: 405,
				height: 150,
				labels: [...history.label],
				datasets: [...data],
				theme: `dark`,
				primaryColor: `crimson`
			}).render()
			const cardLayer = new Card({
				width: 500,
				height: 270,
				theme: `dark`,
				primaryColor: `crimson`,
				marginTop: 50
			})
			//	Create base card.
			.createBase({})
			//	Add two header title on left and right. With captions as well.
			.addTitle({main: `${title} (${this.dateThreeshold} days)`, caption: `Annie's System Metrics`, align: `left`, inline: true})
			.addTitle({main: liveData[this.selectedMetric], caption: `(${percentage <= 0 ? `` : `+`}${percentage.toFixed(2)}%)`, align: `right`, inline: true, releaseHook: true})
			//	Response Time Chart for the past 24 hours.
			.addContent({img: chartLayer, marginTop: -60})

			loading.delete()
			//  Render card
			await reply(``, {
				prebuffer: true,
				simplified: true,
				image: (await cardLayer).ready().toBuffer()
			})
		})
	}

	/**
	 * Default response when no additional arg is provided
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 * @returns {reply}
	 */
	async displayGeneralStatus({ reply, name, commanifier }) {
		const { total } = await this.bot.db.getTotalCommandUsage()
		const uptimeDuration = moment.duration(this.bot.uptime)
		return reply(`Maintained by \`${this.bot.users.cache.get(`230034968515051520`).tag}\` & \`${this.bot.users.cache.get(`277266191540551680`).tag}\`\n\`\`\`\n{{status}}\n\`\`\``, {
			color: `crimson`,
			header: `The State of Annie`,
			thumbnail: this.bot.user.displayAvatarURL(),
			socket: {
				status: `- Master 			:: v${pkg.version}
- Node.js			:: v${pkg.engines.node}
- Uptime 			:: ${uptimeDuration.days()}d:${uptimeDuration.hours()}h:${uptimeDuration.minutes()}m:${uptimeDuration.seconds()}s
- Memory 			:: ${this.formatBytes(memUsage())}
- Latency			:: ${commanifier(this.bot.ws.ping)}ms
- Commands Ran       :: ${commanifier(total)}
- Guilds 			:: ${commanifier(this.bot.guilds.cache.size)}`
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
	name: `systemStatus`,
	aliases: [`stats`, `botinfo`, `annieinfo`, `info`, `anniestatus`],
	description: `Gives info about the current Annie's Statistic.`,
	usage: `stats`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}