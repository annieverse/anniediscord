const Command = require(`../../libs/commands`)
const moment = require(`moment`)
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
		this.page = `[Discord Bot List Page](https://top.gg/bot/501461775821176832/vote)`
	}

	/**
	 * Running command workflow
	 * @param {PistachioMethods} Object pull any pistachio's methods in here.
	 */
	async execute({ reply, name, emoji }) {
		await this.requestUserMetadata(2)
		//  Handle if user's vote still in cooldown
		if (await this.bot.dbl.hasVoted(this.user.id)) return reply(this.locale.VOTE.IS_COOLDOWN, {
			status: `fail`,
			header: `Hi, ${name(this.user.id)}!`,
			socket: {page: this.page}
		})
		reply(this.locale.VOTE.READY, {
			header: `Hi, ${name(this.user.id)}!`,
			color: `lightgreen`,
			socket: {
				emoji: emoji(`AnnieSmile`),
				url: this.page
			}
		})
	}
}


module.exports.help = {
	start: Vote,
	name: `vote`,
	aliases: [`vote`, `vt`, `vot`],
	description: `Upvote Annie and get the reward!`,
	usage: `vote`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false
}