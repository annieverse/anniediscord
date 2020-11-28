const Command = require(`../../libs/commands`)
const Experience = require(`../../libs/exp`)
/**
 * Converts Artcoins into EXP at the rate of 2:1
 * @author klerikdust
 */
class ConvertArtcoins extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
		super(Stacks)
		this.artcoinsRatio = 8
		this.banner = `https://i.ibb.co/1RYgGJV/artcoins-convert.png`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, emoji, name, trueInt, commanifier, avatar, bot:{db} }) {
    	await this.requestUserMetadata(2)

		//  Returns as guide if user doesn't specify any parameters
		if (!this.args[0]) return reply(this.locale.CARTCOIN.SHORT_GUIDE, {
			prebuffer: true,
			image: this.banner,
			socket: {
				emoji: emoji(`AnnieHype`),
				prefix: this.bot.prefix
			},
			footer: `Keep in mind the conversion rate is 1:${this.artcoinsRatio}`
		})
		const amountToUse = this.args[0].startsWith(`all`) ? this.user.inventory.artcoins : trueInt(this.args[0])
		//  Returns if user's artcoins is below the amount of going to be used
		if (this.user.inventory.artcoins < amountToUse) return reply(this.locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
			socket: {
				amount: `${emoji(`artcoins`)}${commanifier(this.user.inventory.artcoins)}`,
				emoji: emoji(`AnnieYandere`)
			}
		})
		//  Returns if user amount input is below the acceptable threeshold
		if (!amountToUse || amountToUse < this.artcoinsRatio) return reply(this.locale.CARTCOIN.INVALID_AMOUNT, {
			socket: {
				emoji: emoji(`AnnieMad`)
			}
		})
		const totalGainedExp = amountToUse / this.artcoinsRatio
		this.confirmation = await reply(this.locale.CARTCOIN.CONFIRMATION, {
			thumbnail: avatar(this.user.id),
			notch: true,
			socket: {
				emoji: emoji(`artcoins`),
				amount: commanifier(amountToUse),
				gainedExp: commanifier(totalGainedExp)
			}
		})
		this.addConfirmationButton(`checkout`, this.confirmation)
 		return this.confirmationButtons.get(`checkout`).on(`collect`, async r => {
			//	Deduct balance & add new exp
			await db.updateInventory({itemId: 52, value: amountToUse, operation: `-`, userId: this.user.id, guildId: this.message.guild.id})
			await new Experience({bot:this.bot, message:this.message}).execute(totalGainedExp)
			this.confirmation.delete()
			reply(this.locale.CARTCOIN.SUCCESSFUL, {
				status: `success`,
				socket: {
					artcoins: `${emoji(`artcoins`)} ${commanifier(amountToUse)}`,
					exp: `${commanifier(totalGainedExp)} EXP`
				}
			})
		})
	}
}

module.exports.help = {
	start: ConvertArtcoins,
	name: `cartcoin`,
	aliases: [`convertac`, `acconvert`, `cartcoin`, `cartcoins`, `artcoinconvert`, `convertartcoin`],
	description: `Converts Artcoins into EXP at the rate of 1:8`,
	usage: `cartcoin <Amount>`,
	group: `User`,
	permissionLevel: 0,
	multiUser: false
}