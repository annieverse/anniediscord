const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Gives a reputation point to a user. Once a day.
 * @author klerikdust
 */
class Reputation extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.cooldown = [23, `hours`]
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		const now = moment()
		const lastGiveAt = await this.bot.db.toLocaltime(this.author.reputations.last_giving_at)
		//  Returns if user's last reps give still under 23 hours.
		if (now.diff(lastGiveAt, this.cooldown[1]) < this.cooldown[0]) return this.reply(this.locale.GIVE_REPUTATION.IN_COOLDOWN, {
			thumbnail: this.author.master.displayAvatarURL(),
			socket: {time: moment(lastGiveAt).add(...this.cooldown).fromNow()},
		})
		//	Displays short-guide if user doesn't specify any parameter
		if (!this.fullArgs) return this.reply(this.locale.GIVE_REPUTATION.SHORT_GUIDE, {
			socket: {emoji: await this.bot.getEmoji(`692429004417794058`), prefix: this.bot.prefix} 
		})
		//	Handle if target user is invalid
		if (!this.user) return this.reply(this.locale.USER.IS_INVALID)
		//	Handle if user is trying to rep themselves
		if (this.user.master.id === this.message.author.id) return this.reply(this.locale.GIVE_REPUTATION.SELF_TARGETING, {socket: {emoji: await this.bot.getEmoji(`692428748838010970`)} })
		this.bot.db.addUserReputation(1, this.user.master.id, this.author.master.id, this.message.guild.id)
		this.bot.db.updateReputationGiver(this.author.master.id, this.message.guild.id)
		return this.reply(this.locale.GIVE_REPUTATION.SUCCESSFUL, {
			status: `success`,
			thumbnail: this.user.master.displayAvatarURL(),
			socket: {user: this.user.master.username}
		})
	}
}

module.exports.help = {
	start: Reputation,
	name: `rep`,
	aliases: [`reps`, `reputation`, `reputations`, `reputationpoint`, `praise`, `commend`],
	description: `Gives a reputation point to a user. Once a day.`,
	usage: `rep <User>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true,
	rawArgs: true
}
