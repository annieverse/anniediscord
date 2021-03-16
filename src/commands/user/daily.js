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
		//  Handle if user could not be found
		if (!this.user) return reply(this.locale.USER.IS_INVALID)
		const now = moment()
		const lastClaimAt = await db.toLocaltime(this.user.dailies.updated_at)
		//	Returns if user next dailies still in cooldown (refer to property `this.cooldown` in the constructor)
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) return reply(this.locale.DAILIES[this.user.isSelf ? `AUTHOR_IN_COOLDOWN` : `OTHERS_IN_COOLDOWN`], {
			thumbnail: avatar(this.user.master.id),
			topNotch: this.user.isSelf 
				? `**Are you craving for artcoins?** ${emoji(`AnnieCry`)}` 
				: `**${name(this.user.master.id)} already claimed their dailies!** ${emoji(`AnnieMad`)}`,
			socket: {
				time: moment(lastClaimAt).add(...this.cooldown).fromNow(),
				user: name(this.user.master.id),
				prefix: this.bot.prefix
			}
		})
		//  If user hasn't claimed their dailies over 2 days, the current total streak will be reset to zero.
		let totalStreak = now.diff(lastClaimAt, `days`) >= 2 ? 0 : this.user.dailies.total_streak + 1
		//  If user has a poppy card, ignore streak expiring check.
		const hasPoppy = this.user.inventory.poppy_card
		if (hasPoppy) totalStreak = this.user.dailies.total_streak + 1
		let bonus = totalStreak ? this.bonusAmount * totalStreak : 0 
		await db.updateUserDailies(totalStreak, this.user.master.id, this.message.guild.id)
		await db.updateInventory({itemId: 52, value: this.rewardAmount + bonus, operation: `+`, userId: this.user.master.id, guildId: this.message.guild.id})
		reply(this.locale.DAILIES.CLAIMED, {
			status: `success`,
			thumbnail: avatar(this.user.master.id),
			topNotch: totalStreak ? `**__${totalStreak} Days Chain!__**` : ` `,
			socket: {
				amount: `${emoji(`artcoins`)}${commanifier(this.rewardAmount)}${bonus ? `(+${commanifier(bonus)})` : ``}`,
				user: name(this.user.master.id),
				praise: totalStreak ? `*Keep the streaks up!~♡*` : `*Comeback tomorrow~♡*`
			}
		})
		return reply(this.locale.DAILIES.TO_REMIND, {
			simplified: true,
			socket: {prefix:this.bot.prefix}
		})
	}
}

module.exports.help = {
	start: Dailies,
	name: `daily`,
	aliases: [`dly`, `daili`, `dail`, `dayly`, `attendance`, `dliy`],
	description: `Claims free artcoins everyday. You can also help claiming your friend's dailies!`,
	usage: `daily <User>(Optional)`,
	group: `User`,
	permissionLevel: 0,
	multiUser: true
}