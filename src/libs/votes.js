const DBL = require(`dblapi.js`)
const commanifier = require(`../utils/commanifier`)
const emoji = require(`../utils/emojiFetch`)
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
		const dbl = new DBL(process.env.DBLTOKEN, {
	        webhookAuth: process.env.DBLWEBHOOK_AUTH,
	        webhookPort: parseInt(process.env.DBLWEBHOOK_PORT)+this.bot.shard.ids[0]
	        }
	    )
	    this.bot.registerNode(dbl, `dbl`)
		dbl.webhook.on(`ready`, hook => this.logger.info(`Webhook running at http://${hook.hostname}:${hook.port}${hook.path}`))
		dbl.webhook.on(`vote`, async vote => {
			this.logger.info(`USER_ID:${vote.user} SHARD_ID:${this.bot.shard.ids[0]} just voted!`)
			const guildfromShards = await this.bot.shard.fetchClientValues(`guilds.cache.size`)
			dbl.postStats(guildfromShards.reduce((acc, guildCount) => acc + guildCount, 0))
			const user = await this.bot.users.fetch(vote.user)
			try {
				this.bot.db.updateInventory({itemId: 52, userId: vote.user, value: this.reward, distributeMultiAccounts: true})
				user.send(`**Thanks for the voting, ${user.username}!** I've sent ${await emoji(`artcoins`, this.bot)}**${commanifier(this.reward)}** to your inventory as the reward!\nYou can check it by typing \`${this.prefix}bal\` or \`${this.prefix}inventory\` in the server.`)
			}
			catch (e) {
				this.logger.warn(`${fn} has failed to send reward notification due to locked DM for USER_ID: ${vote.user} > ${e.stack}`)
			}
		})
	}
}

module.exports = Votes