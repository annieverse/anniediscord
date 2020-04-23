const Card = require(`../../ui/components/cards`)
const Chart = require(`../../ui/components/charts`)
const moment = require(`moment`)
const memUsage = require(`../../utils/memoryUsage`)
const cpuUsage = require(`../../utils/cpuUsage`)
const Command = require(`../../libs/commands`)
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
		this.selectedMetric = `ping`
		this.dateThreeshold = 30 // 30 days
	}

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji, trueInt, commanifier, bot:{db, ping, uptime, locale:{SYSTEM_STATS}} }) {

		//  Handle user's custom data category
		if (this.args[0]) this.selectedMetric = this.args[0]
		//  Handle user's custom data parameter
		if (this.args[1]) {
			const customDate = trueInt(this.args[1])
			if (!customDate) return reply(SYSTEM_STATS.INVALID_DATE, {color: `red`})
			this.dateThreeshold = customDate
		}

		reply(SYSTEM_STATS.FETCHING, {simplified: true, socket: [emoji(`AAUloading`)]})
		.then(async loading => {

			const now = moment()
			const responsesHistory = this.selectedMetric.startsWith(`command`) ? await db.getDailyCommandUsage(this.dateThreeshold) : await db.getResourceData(this.dateThreeshold)
			const history = {
				datasets: responsesHistory.map(data => data[this.selectedMetric]),
				label: responsesHistory.map(data => data.on_date) 
			}
			//  Handle if no data is found for given category
			if (!history.datasets[0]) {
				loading.delete()
				return reply(SYSTEM_STATS.NO_DATA_FOUND, {color: `red`, socket: [this.selectedMetric, emoji(`AnnieCry`)]})
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
				labels: [`now`, now.subtract(Math.round(this.dateThreeshold/2), `days`).fromNow(), now.subtract(Math.round(this.dateThreeshold), `days`).fromNow()],
				datasets: [data[0], ...data],
				theme: `dark`,
				primaryColor: `crimson`
			}).render()
			const cardLayer = new Card({
				width: 500,
				height: 320,
				theme: `dark`,
				primaryColor: `crimson`
			})
			//	Create base card.
			.createBase({})
			//	Add two header title on left and right. With captions as well.
			.addTitle({main: `${title} (${this.dateThreeshold} days)`, caption: `Annie's System Metrics`, align: `left`})
			.addTitle({main: liveData[this.selectedMetric], caption: `(${percentage <= 0 ? `` : `+`}${percentage.toFixed(2)}%)`, align: `right`, inline: true})
			//	Response Time Chart for the past 24 hours.
			.addContent({img: chartLayer, marginTop: 20})

			loading.delete()
			//  Render card
			await reply(``, {
				prebuffer: true,
				simplified: true,
				image: await cardLayer.ready().toBuffer()
			})
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
	aliases: [`anniestatus`, `botinfo`, `annieinfo`, `info`],
	description: `Gives info about the current bot performance.`,
	usage: `stats`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}