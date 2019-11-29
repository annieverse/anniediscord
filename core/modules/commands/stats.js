const StatsUI = require(`../../utils/StatsInterface`)
const SI = require(`systeminformation`)
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
	 * 	Returns recorded previous resource data from database.
	 * 	@resourceHistory
	 */
	async resourceHistory() {
		let { bot:{db} } = this.stacks
		const res = await db._query(`SELECT avg_load FROM resource_usage ORDER BY timestamp ASC`, `all`)
		return res.map(data => data.avg_load)
	}


	/**
	 * 	Returns current machine resource usage such as cpu, memory, etc
	 * 	@resource
	 */
	async resource() {
		let { bot:{ping} } = this.stacks
		let memoryData = await SI.mem()
		let processes = await SI.currentLoad()
		
		return {
			avg: processes.currentload,
			memory: this.toPercentage(memoryData.used, memoryData.total),
			cpu: processes.cpus[0].load,
			ping: ping
		}
	}
	

	async execute() {
		const { reply, emoji, meta:{ data } } = this.stacks

		return reply(`\`fetching resource data ...\``, {simplified: true})
			.then(async load => {
				//	Fetching resource
				const resourceData = await this.resource()
				//	Fetching render
				const perfCard = await new StatsUI({
					resource: resourceData,
					theme: data.interfacemode,
					history: await this.resourceHistory()
				}).render()

				reply(`${emoji(`AnnieGeek`)} **| Performance Status**`, {
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