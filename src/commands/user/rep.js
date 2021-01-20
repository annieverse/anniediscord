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
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, avatar, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)
		const now = moment()
		const lastGiveAt = await db.toLocaltime(this.author.reputations.last_giving_at)
		//  Returns if user's last reps give still under 23 hours.
		if (now.diff(lastGiveAt, this.cooldown[1]) < this.cooldown[0]) return reply(this.locale.GIVE_REPUTATION.IN_COOLDOWN, {
			thumbnail: avatar(this.author.id),
			socket: {time: moment(lastGiveAt).add(...this.cooldown).fromNow()},
		})
		//	Displays short-guide if user doesn't specify any parameter
		if (!this.fullArgs) return reply(this.locale.GIVE_REPUTATION.SHORT_GUIDE, {
			socket: {emoji: emoji(`AnnieWink`), prefix: this.bot.prefix} 
		})
		//	Handle if target user is invalid
		if (!this.user) return reply(this.locale.USER.IS_INVALID)
		//	Handle if user is trying to rep themselves
		if (this.user.isSelf) return reply(this.locale.GIVE_REPUTATION.SELF_TARGETING, {socket: {emoji: emoji(`AnnieMad`)} })

		await db.addUserReputation(1, this.user.id, this.author.id,this.message.guild.id)
		await db.updateReputationGiver(this.author.id, this.message.guild.id)
		return reply(this.locale.GIVE_REPUTATION.SUCCESSFUL, {
			status: `success`,
			thumbnail: avatar(this.user.id),
			socket: {user: name(this.user.id)}
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