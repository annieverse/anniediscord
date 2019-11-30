const StatsUI = require(`../../utils/StatsInterface`)
const nodeutils = require(`node-os-utils`)
class Stats {

	constructor(Stacks) {
		this.stacks = Stacks
	}
	

	/**
	 * Used to format returned bytes values from `resourceData()` into more human-readable data.
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


	/**
	 * Converting values into percentage.
	 * @param {Number} min 
	 * @param {Number} max 
	 */
	toPercentage(min, max) {
		return (min/max) * 100
	}


	/**
	 * 	Returns recorded previous response time data from database.
	 * 	@responseTimeHistory
	 */
	async responseTimeHistory() {
		let { bot:{db} } = this.stacks
		const res = await db._query(`SELECT timestamp, ping FROM resource_usage ORDER BY timestamp ASC`, `all`)
		return {
			datasets: res.map(data => data.ping),
			label: res.map(data => data.timestamp)
		}
	}


	/**
	 * 	Returns currentresource usage such as cpu, memory, etc
	 * 	@resource
	 */
	async resource() {
		let { bot:{uptime, ping} } = this.stacks
		let memUsage = process.memoryUsage().heapUsed
		let cpuUsage = await nodeutils.cpu.usage()
		
		return {
			uptime: uptime,
			memory: memUsage,
			cpu: cpuUsage,
			ping: ping
		}
	}
	

	async execute() {
		const { reply, emoji, meta:{ data } } = this.stacks

		return reply(`\`fetching metrics data ...\``, {simplified: true})
			.then(async load => {
				//	Fetching resource
				const resourceData = await this.resource()
				//	Fetching render
				const perfCard = await new StatsUI({
					resource: resourceData,
					theme: data.interfacemode,
					history: await this.responseTimeHistory()
				}).render()

				reply(`${emoji(`AnnieGeek`)} **| System Metrics**`, {
					simplified: true,
					prebuffer: true,
					image: perfCard
				})

				load.delete()
			})
	}

}

module.exports.help = {
	start: Stats,
	name: `stats`,
	aliases: [`anniestatus`, `botinfo`, `annieinfo`, `info`],
	description: `Gives info about the bot`,
	usage: `anniestats`,
	group: `server`,
	public: true,
	required_usermetadata: false,
	multi_user: false
}