const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Claims free artcoins everyday. You can also help claiming your friend's dailies.
 * @author klerikdust
 */
class Dailies extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.rewardAmount = 250
		this.bonusAmount = 10
		this.cooldown = [23, `hours`]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, avatar, commanifier, bot:{db} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)

		if (!this.user) return reply(this.locale.USER.IS_INVALID, {color: `red`})
		const now = moment()
		const lastClaimAt = await db.toLocaltime(this.user.dailies.updated_at)
		//	Returns if user next dailies still in cooldown (refer to property `this.cooldown` in the constructor)
		const COOLDOWN_MSG = this.user.isSelf ? this.locale.DAILIES.AUTHOR_IN_COOLDOWN : this.locale.DAILIES.OTHERS_IN_COOLDOWN
		if (now.diff(lastClaimAt, this.cooldown[1]) <= this.cooldown[0]) return reply(COOLDOWN_MSG, {
			color: `red`,
			socket: {time: moment(lastClaimAt).add(...this.cooldown).fromNow(), user: name(this.user.id)}
		})
		//  If user hasn't claimed their dailies over 2 days, the current total streak will be reset to zero.
		let totalStreak = now.diff(lastClaimAt, `days`) >= 2 ? 0 : this.user.dailies.total_streak + 1
		//  If user has a poppy card, ignore streak expiring check.
		const hasPoppy = this.user.inventory.poppy_card
		if (hasPoppy) totalStreak = this.user.dailies.total_streak + 1
		let bonus = totalStreak ? this.bonusAmount * totalStreak : 0 

		await db.updateUserDailies(totalStreak, this.user.id)
		await db.updateInventory({itemId: 52, value: this.rewardAmount + bonus, operation: `+`, userId: this.user.id})
		await reply(this.locale.DAILIES.CLAIMED, {
			color: hasPoppy ? `purple` : `lightgreen`,
			notch: true,
			thumbnail: avatar(this.user.id),
			socket: {
				amount: `${emoji(`artcoins`)}${commanifier(this.rewardAmount)}${bonus ? `(+${commanifier(bonus)})` : ``}`,
				user: this.user.isSelf ? `You` : name(this.user.id)
			}
		})

		if (!totalStreak) return
		return reply(this.locale.DAILIES.STREAKS, {
			simplified: true,
			socket: {
				streaks: commanifier(totalStreak),
				user: this.user.isSelf ? `You` : name(this.user.id),
				extension: this.user.isSelf ? this.locale.DAILIES.STREAK_INCREASING : this.locale.DAILIES.THANKS_HELP
			}
		})
	}
}

module.exports.help = {
	start: Dailies,
	name: `daily`,
	aliases: [`dly`, `daili`, `dail`, `dayly`, `attendance`, `dliy`],
	description: `Claims free artcoins everyday. You can also help claiming your friend's dailies`,
	usage: `daily <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}