const Command = require(`../../libs/commands`)
const commanifier = require(`../../utils/commanifier`)
const trueInt = require(`../../utils/trueInt`)
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
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
    	await this.requestUserMetadata(2)
		//  Returns as guide if user doesn't specify any parameters
		if (!this.args[0]) return this.reply(this.locale.CARTCOIN.SHORT_GUIDE, {
			image: `banner_cartcoins`,
			socket: {
				emoji: await this.bot.getEmoji(`692428692999241771`),
				prefix: this.bot.prefix
			},
			footer: `Keep in mind the conversion rate is 1:${this.artcoinsRatio}`
		})
		const amountToUse = this.args[0].startsWith(`all`) ? this.user.inventory.artcoins : trueInt(this.args[0])
        //  Returns if user amount input is below the acceptable threeshold
        if (!amountToUse || amountToUse < this.artcoinsRatio) return this.reply(this.locale.CARTCOIN.INVALID_AMOUNT, {
            socket: {
                emoji: await this.bot.getEmoji(`692428748838010970`)
            }
        })
		const totalGainedExp = amountToUse / this.artcoinsRatio
		this.confirmation = await this.reply(this.locale.CARTCOIN.CONFIRMATION, {
			thumbnail: this.user.master.displayAvatarURL(),
			notch: true,
			socket: {
				emoji: await this.bot.getEmoji(`758720612087627787`),
				amount: commanifier(amountToUse),
				gainedExp: commanifier(totalGainedExp)
			}
		})
		await this.addConfirmationButton(`checkout`, this.confirmation)
 		return this.confirmationButtons.get(`checkout`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return this.reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await this.bot.getEmoji(`781954016271138857`)}
			})
            //  Returns if user's artcoins is below the amount of going to be used
            if (this.user.inventory.artcoins < amountToUse) return this.reply(this.locale.CARTCOIN.INSUFFICIENT_AMOUNT, {
                socket: {
                    amount: `${await this.bot.getEmoji(`758720612087627787`)}${commanifier(this.user.inventory.artcoins)}`,
                    emoji: await this.bot.getEmoji(`790338393015713812`)
                }
            })
			//	Deduct balance & add new exp
			this.bot.db.updateInventory({itemId: 52, value: amountToUse, operation: `-`, userId: this.user.master.id, guildId: this.message.guild.id})
			this.bot.experienceLibs(this.message.member, this.message.guild, this.message.channel).execute(totalGainedExp)
			this.confirmation.delete()
			this.reply(this.locale.CARTCOIN.SUCCESSFUL, {
				status: `success`,
				socket: {
					artcoins: `${await this.bot.getEmoji(`758720612087627787`)} ${commanifier(amountToUse)}`,
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
	description: `Converts Artcoins into EXP at the rahttps://media.discordapp.net/attachments/527190439661404174/843838360396234763/unknown.png?size=64te of 1:8`,
	usage: `cartcoin <Amount>`,
	group: `User`,
	permissionLevel: 0
}
