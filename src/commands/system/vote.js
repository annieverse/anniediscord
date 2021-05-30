const Command = require(`../../libs/commands`)
/**
 * Upvote Annie and get the reward!
 * @author klerikdust
 */
class Vote extends Command {
	constructor(Stacks) {
		super(Stacks)
        /**
         * The website to vote Annie
         * @type {string}
         */ 
		this.page = `https://top.gg/bot/501461775821176832`
	}

	/**
	 * Running command workflow
	 * @return {void}
	 */
	async execute() {
        if (!this.bot.dblApi) return this.reply(this.locale.VOTE.UNAVAILABLE)
		const voted = await this.bot.dblApi.hasVoted(this.message.author.id)
		if (voted) return this.reply(this.locale.VOTE.IS_COOLDOWN, {
			socket: {
				page: `[write a review](${this.page})`,
				emoji: await this.bot.getEmoji(`692428785571856404`)
			}
		})
		return this.reply(this.locale.VOTE.READY, {
			header: `Hi, ${this.message.author.username}`,
			image: `banner_votes`,
			socket: {
				emoji: await this.bot.getEmoji(`692428927620087850`),
				url: `[Discord Bot List](${this.page}/vote)`
			}
		})
	}
}

module.exports.help = {
	start: Vote,
	name: `vote`,
	aliases: [`vote`, `vt`, `vot`, `votes`, `upvote`],
	description: `Upvote Annie and get the reward!`,
	usage: `vote`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}
