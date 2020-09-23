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

	execute() {
		const fn = `[Votes.execute()]`
		const dbl = new DBL(process.env.DBLTOKEN, {
	        webhookAuth: process.env.DBLWEBHOOK_AUTH,
	        webhookPort: process.env.PORT
	        }
	    )
	    this.bot.registerNode(dbl, `dbl`)
		dbl.postStats(this.bot.guilds.cache.size)
		dbl.webhook.on(`ready`, hook => this.logger.info(`Webhook running at http://${hook.hostname}:${hook.port}${hook.path}`))
		dbl.webhook.on('vote', vote => {
			this.logger.info(`USER_ID: ${vote.user} just voted!`)
			this.bot.db.updateInventory({itemId: 52, userId: vote.user, value: this.reward, distributeMultiAccounts: true})
			const user = this.bot.users.cache.get(vote.user)
			try {
				user.send(`**Thanks for the voting, ${user.user.username}!** I've sent ${this.bot.emojis.find(node => node.name === `artcoins`)}**${commanifier(this.reward)}** to your inventory as the reward!\nYou can check it by typing \`${this.prefix}bal\` or \`${this.prefix}inventory\` in the server.`)
			}
			catch {
				this.logger.warn(`${fn} has failed to send reward notification due to locked DM for USER_ID: ${vote.user}`)
			}
		})
	}
}

module.exports = Votes