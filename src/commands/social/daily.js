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
		this.bonusAmount = 5
		this.cooldown = [23, `hours`]
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, commanifier, bot:{db, locale:{DAILIES}} }) {
		await this.requestUserMetadata(2)
		await this.requestAuthorMetadata(2)

		//  Handle if user doesn't exists
		if (!this.user) return reply(DAILIES.INVALID_USER, {color: `red`})

		const now = moment()
		const lastClaimAt = await db.toLocaltime(this.user.dailies.last_updated_at)

		//	Returns if user next dailies still in cooldown (refer to property `this.cooldown` in the constructor)
		const COOLDOWN_MSG = this.user.isSelf ? DAILIES.AUTHOR_IN_COOLDOWN : DAILIES.OTHERS_IN_COOLDOWN
		if (now.diff(lastClaimAt, this.cooldown[1]) <= this.cooldown[0]) return reply(COOLDOWN_MSG, {
			socket: [moment(lastClaimAt).add(...this.cooldown).fromNow(), name(this.user.id)],
			color: `red`
		})

		//  If user hasn't claimed their dailies over 2 days, the current total streak will be reset to zero.
		let totalStreak = now.diff(lastClaimAt, `days`) >= 2 ? 0 : this.user.dailies.total_streak + 1
		//  If user has a poppy card, ignore streak expiring check.
		if (this.user.inventory.poppy_card) totalStreak = this.user.dailies.total_streak + 1
		let bonus = totalStreak ? this.bonusAmount * totalStreak : 0 

		//  Update db
		await db.updateUserDailies(totalStreak, this.user.id)
		await db.updateInventory({itemId: 52, value: this.rewardAmount + bonus, operation: `+`, userId: this.user.id})

		//  Handle special case if user is helping other user claiming dailies
		const CLAIM_MSG = this.user.isSelf ? DAILIES.CLAIMED : DAILIES.HELP_CLAIMING_OTHERS_DAILIES
		return reply(CLAIM_MSG, {
			color: this.user.isSelf ? `lightgreen` : `purple`,
			socket: [
				name(this.user.id),
				`${emoji(`artcoins`)}${commanifier(this.rewardAmount)}${bonus ? `(+${commanifier(bonus)})` : ``}`,
				totalStreak ? `with **${totalStreak} days** of consecutive claims` : ``,
				name(this.author.id),
				emoji(`AnniePogg`)
			]
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