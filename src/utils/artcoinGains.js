const Controller = require(`../../structures/messageController`)


/**
 *  A subset artcoins handler from MessageController.js
 *  The main purpose is to encapsulate ExperienceFormula.js from doing any artcoins calculation.
 *  And also easier to maintain.
 * 
 *  NOTE:
 *  1. This only can be used inside ExperienceFormula.js chains, if you trying to make it work outside of it then
 *  make sure it is properly mocked.
 *  @Artcoins
 */
class Artcoins extends Controller {
    constructor(data) {
		super(data)
        this.data = data
        this.bot = data.bot
		this.updated = data.updated
		this.meta = data.meta
		this.commanifier = data.commanifier
		this.moduleID = `AC_GAIN_${data.message.author.id}`
		this.totalGain = data.bot.config.currency.totalGain
    }


	onLevelUp() {
		//	The rewards will be choosen by the difference between previous level and new level.
		return (this.updated.level - this.meta.data.level) > 1  ? this._multiLevelUpReward() : this._singleLevelUpReward()
	}


    runAndUpdate() {
		//	Multiply the exp gained by ten times if the message is an art post.
		if (super.isArtPost) this.totalGain = this.totalGain * 10

		const gainedAc = Math.floor(this.totalGain)
		this.db.storeArtcoins(gainedAc)

		//	Log record
		const guildInfo = `${this.message.guild.name} | ${this.message.channel.name}`
		const acDifference = `${this.commanifier(this.meta.data.artcoins)} --> ${this.commanifier(this.meta.data.artcoins + gainedAc)}`
		this.logger.info(`[${guildInfo}] ${this.moduleID} received ${gainedAc} AC (${acDifference})`)
    }

	
	_singleLevelUpReward() {
		for (let i = this.meta.data.level + 1; i <= this.updated.level; i++) {
			const updatedlevel = i
			const bonusac = updatedlevel === 0 ? 35 : 35 * updatedlevel
			this.db.storeArtcoins(bonusac)
			this.reply(this.code.LEVELUP, {
				socket: [
					this.emoji(`AnnieYay`),
					this.meta.author,
					updatedlevel,
					this.emoji(`artcoins`),
					this.data.commanifier(bonusac)
				],
				color: this.color.purple
			})
			this.logger.info(`${this.author.tag}: level up to LVL ${updatedlevel} in ${this.message.channel.name}`)
		}
	}

	
	_multiLevelUpReward() {
		const threeshold = this.updated.level - this.meta.data.level
		let bonusac = 0
		for (let i = 0; i<threeshold; i++) {
			bonusac += 35 * (this.meta.data.level + i)
			this.db.storeArtcoins(bonusac)
			return this.reply(this.code.LEVELUP_JUMP, {
				socket: [
					this.emoji(`AnnieDab`),
					this.meta.author,
					this.updated.level,
					threeshold,
					this.emoji(`artcoins`),
					this.data.commanifier(bonusac)
				],
				color: this.color.purple
			})
		}
	}
}


module.exports = Artcoins