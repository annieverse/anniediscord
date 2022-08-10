const moment = require(`moment`)
const User = require(`../../libs/user`)
const commanifier = require(`../../utils/commanifier`)
const {
	ApplicationCommandType,
	ApplicationCommandOptionType
} = require(`discord.js`)
/**
 * Claims free artcoins everyday. You can also help claiming your friend's dailies.
 * @author klerikdust
 */
module.exports = {
	name: `daily`,
	aliases: [`dly`, `daili`, `dail`, `dayly`, `attendance`, `dliy`],
	description: `Claims free artcoins everyday. You can also help claiming your friend's dailies!`,
	usage: `daily <User>(Optional)`,
	permissionLevel: 0,
	rewardAmount: 250,
	bonusAmount: 10,
	applicationCommand: true,
	cooldown: [23, `hours`],
	options: [{
		name: `user`,
		description: `User you wish to claim daily of`,
		required: false,
		type: ApplicationCommandOptionType.User
	}],
	type: ApplicationCommandType.ChatInput,
	async execute(client, reply, message, arg, locale) {
		await this.claimDaily(client, message, reply, locale, {
			arg: arg
		})
	},
	async Iexecute(client, reply, interaction, options, locale) {
		await this.claimDaily(client, interaction, reply, locale, {
			isInteraction: true
		})
	},
	async claimDaily(client, messageObject, reply, locale, {
		arg,
		isInteraction = false
	}) {
		const userLib = new User(client, messageObject)
		let targetUser
		if (isInteraction) {
			targetUser = messageObject.options.getUser(`user`) || messageObject.member.user
		} else {
			targetUser = arg ? await userLib.lookFor(arg) : messageObject.author
			if (!targetUser) return reply.send(locale.USER.IS_INVALID)
			//  Normalize structure
			targetUser = targetUser.master || targetUser
		}
		//  Normalize structure
		const targetUserData = await userLib.requestMetadata(targetUser, 2)
		const isSelf = userLib.isSelf(targetUser.id)
		const now = moment()
		const lastClaimAt = await client.db.toLocaltime(targetUserData.dailies.updated_at)
		//	Returns if user next dailies still in cooldown (refer to property `this.cooldown` in the constructor)
		if (now.diff(lastClaimAt, this.cooldown[1]) < this.cooldown[0]) return reply.send(locale.DAILIES[isSelf ? `AUTHOR_IN_COOLDOWN` : `OTHERS_IN_COOLDOWN`], {
			thumbnail: targetUser.displayAvatarURL(),
			topNotch: isSelf ?
				`**Are you craving for artcoins?** ${await client.getEmoji(`692428578683617331`)}` :
				`**${targetUser.username} already claimed their dailies!** ${await client.getEmoji(`692428748838010970`)}`,
			socket: {
				time: moment(lastClaimAt).add(...this.cooldown).fromNow(),
				user: targetUser.username,
				prefix: client.prefix
			}
		})
		//  If user hasn't claimed their dailies over 2 days, the current total streak will be reset to zero.
		let totalStreak = now.diff(lastClaimAt, `days`) >= 2 ? 0 : targetUserData.dailies.total_streak + 1
		//  If user has a poppy card, ignore streak expiring check.
		const hasPoppy = targetUserData.inventory.poppy_card
		if (hasPoppy) totalStreak = targetUserData.dailies.total_streak + 1
		let bonus = totalStreak ? this.bonusAmount * totalStreak : 0
		client.db.updateUserDailies(totalStreak, targetUser.id, messageObject.guild.id)
		client.db.updateInventory({
			itemId: 52,
			value: this.rewardAmount + bonus,
			userId: messageObject.member.id,
			guildId: messageObject.guild.id
		})
		reply.send(locale.DAILIES.CLAIMED, {
			status: `success`,
			thumbnail: targetUser.displayAvatarURL(),
			topNotch: totalStreak ? `**__${totalStreak} Days Chain!__**` : ` `,
			socket: {
				amount: `${await client.getEmoji(`758720612087627787`)}${commanifier(this.rewardAmount)}${bonus ? `(+${commanifier(bonus)})` : ``}`,
				user: targetUser.username,
				praise: totalStreak ? `*Keep the streaks up!~♡*` : `*Comeback tomorrow~♡*`
			}
		})
		return reply.send(locale.DAILIES.TO_REMIND, {
			simplified: true,
			socket: {
				prefix: client.prefix
			},
			followUp: true
		})
	}
}