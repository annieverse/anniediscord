const StatsUI = require(`../../utils/StatsInterface`)
const memUsage = require(`../../utils/memoryUsage`)
class Stats {

	constructor(Stacks) {
		this.stacks = Stacks
	}


	/**
	 * 	Returns recorded previous response time data from database.
	 * 	@responseTimeHistory
	 */
	async responseTimeHistory() {
		let { bot:{db} } = this.stacks
		const res = await db._query(`SELECT timestamp, ping FROM resource_usage ORDER BY timestamp DESC LIMIT 100`, `all`)
		return {
			datasets: res.map(data => data.ping),
			label: res.map(data => data.timestamp)
		}
	}

	/**
	 * 	Returns total amount of recorded command queries that has been ran.
	 * 	@commandQueriesCount
	 */
	async commandQueriesCount() {
		let { bot:{db} } = this.stacks
		const res = await db._query(`SELECT COUNT(command_alias) FROM commands_usage`, `get`)
		return res[`COUNT(command_alias)`]
	}


	/**
	 * 	Returns currentresource usage such as cpu, memory, etc
	 * 	@resource
	 */
	async resource() {
		let { bot:{uptime, ping}, commanifier } = this.stacks
		let cmdUsage = await this.commandQueriesCount()
		
		return {
			uptime: uptime,
			memory: memUsage(),
			commandsRan: commanifier(cmdUsage),
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

				reply(`${emoji(`AnnieGeek`)} **| Resource Usage**`, {
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