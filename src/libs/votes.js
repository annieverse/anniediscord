const DBL = require(`dblapi.js`)
const commanifier = require(`../utils/commanifier`)
/**
 * top.gg votes manager
 * only need current client instance as the dependency.
 */ 
class Votes {
	constructor(bot={}) {
		this.bot = bot
		this.logger = bot.logger
		this.prefix = bot.prefix
		this.reward = 5000
		this.execute()
	}

	async execute() {
		const fn = `[Votes.execute()]`
		//  Uses the existing vote connection
		const existingDblConnection = (await this.bot.shard.broadcastEval(`if (this.dbl) this.dbl`)).filter(cluster => cluster !== null)
		const dbl = existingDblConnection[0] || new DBL(process.env.DBLTOKEN, {
	        webhookAuth: process.env.DBLWEBHOOK_AUTH,
	        webhookPort: process.env.DBLWEBHOOK_PORT
	        }
	    )
	    this.bot.registerNode(dbl, `dbl`)
		dbl.webhook.on(`ready`, hook => this.logger.info(`Webhook running at http://${hook.hostname}:${hook.port}${hook.path}`))
		dbl.webhook.on(`vote`, async vote => {
			this.logger.info(`USER_ID: ${vote.user} just voted!`)
			dbl.postStats((await this.bot.shard.fetchClientValues(`guilds.cache.size`)).reduce((acc, guildCount) => acc + guildCount, 0))
			this.bot.db.updateInventory({itemId: 52, userId: vote.user, value: this.reward, distributeMultiAccounts: true})
			const user = await this.bot.users.fetch(vote.user)
			try {
				user.send(`**Thanks for the voting, ${user.username}!** I've sent ${this.bot.emojis.cache.find(node => node.name === `artcoins`)}**${commanifier(this.reward)}** to your inventory as the reward!\nYou can check it by typing \`${this.prefix}bal\` or \`${this.prefix}inventory\` in the server.`)
			}
			catch (e) {
				this.logger.warn(`${fn} has failed to send reward notification due to locked DM for USER_ID: ${vote.user}`)
			}
		})
	}
}

module.exports = Votes