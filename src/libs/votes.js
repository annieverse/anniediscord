const Topgg = require(`@top-gg/sdk`)
/**
 * top.gg votes manager
 * only need current client instance as the dependency.
 */ 
class Votes {
	constructor(bot={}) {
		this.bot = bot
		this.execute()
	}

	async execute() {
		const api = new Topgg.Api(process.env.DBLTOKEN)
		this.bot.registerNode(api, `dblApi`)
	}
}

module.exports = Votes