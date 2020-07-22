const booster = require(`../../config/ticketbooster`)
const Points = require(`../../libs/points`)
const Artcoins = require(`./artcoins`)

/**
 * Experience formula wrapper.
 * Please follow the default constructor metadata structure in order to make 
 * the class working as expected
 */
class Experience extends Points {
	constructor(data) {
		super(data)
		this.data = data
		this.bot = data.bot
		this.message = data.message
		this.expConfig = data.bot.config.exp
		this.exp_factor = this.expConfig.factor
		this.total_gained_exp = this.expConfig.totalGain
		this.meta = data.meta
		this.updated = {
			currentexp: 0,
			level: 0,
			maxexp: 0,
			nextexpcurve: 0
		}
		this.moduleID = `EXP_GAIN_${data.message.author.id}_${data.message.author.id}`
	}


	async runAndUpdate() {
		try {
			//  Add & calculate bonuses from ticket if there's any
			await this.ticketBuffs()
			//  Calculate overall exp
			await this.updatingExp()
			//	Gives reward if there is a level difference
			if (this.updated.level != this.meta.data.level) new Artcoins(this.data).onLevelUp()

			//	Log record
			const guildInfo = `${this.message.guild.name} | ${this.message.channel.name}`
			const expDifference = `${this.data.commanifier(this.meta.data.currentexp)} --> ${this.data.commanifier(this.updated.currentexp)}`
			this.logger.info(`[${guildInfo}] ${this.moduleID} received ${this.total_gained_exp} EXP (${expDifference})`)

		}
		catch (e) {
			this.logger.error(`ExperienceFormula.js has failed to process. > ${e.stack}`)
		}

	}

	/**
	 * Give user rank rewards based on level achieved
	 * @rankRewards
	 */
	rankRewards(){
		let level = this.meta.data.level
		switch (level) {
			case 85: // For level 85 milestone
				this.db.addReputations(100)
				break
			case 100: // For level 100 milestone
				this.db.addLuckyTickets(100)
				break
			default:
				break
		}
	}

	/**
	 * 	Add new rank
	 * 	@addRank
	 */
	addRank() {
		this.message.guild.member(this.message.author.id).addRole(this.message.guild.roles.find(r => r.name === this.ranks.ranksCheck(this.updated.level).title))
	}

	
	/**
	 * 	Removing duplicate rank
	 * 	@removeRank
	 */
	removeRank() {
		const userDuplicateRanks = (this.ranks.ranksCheck(this.updated.level).lvlcap)
			.filter(val => val < this.updated.level)

		let idpool = []
		for (let i in userDuplicateRanks) {
			idpool.push(((this.ranks.ranksCheck(userDuplicateRanks[i]).rank).id).toString())
		}
		return this.message.guild.member(this.message.author.id).removeRoles(idpool)
	}


	/**
	 * 	Calculate and register new exp value based on predefined formula
	 * 	@updatingExp
	 */
	async updatingExp() {
		//  Apply bonus if available
		this.total_gained_exp = this.total_gained_exp * this.exp_factor
		//  Apply boost if artwork in art channel
		if (super.isArtPost) this.total_gained_exp = this.total_gained_exp * 10


		const accumulatedCurrent = Math.floor(this.total_gained_exp + this.meta.data.currentexp)
		const main = await this.db.xpFormula(accumulatedCurrent)
		//  Save new data
		this.updated.currentexp = accumulatedCurrent
		this.updated.level = main.level
		this.updated.maxexp = main.maxexp
		this.updated.nextexpcurve = main.nextexpcurve

		//  Store new values
		this.db.updateExperienceMetadata(this.updated, this.author.id)
	}


	/**
	 * 	Check if the current rank is same/different with the previous one.
	 * 	Returns Boolean.
	 * 	@rankUp
	 */
	get rankUp() {
		let new_rank = this.ranks.ranksCheck(this.updated.level).title
		let old_rank = this.ranks.ranksCheck(this.meta.data.level).title

		return new_rank !== old_rank ? true : false
	}


	get fixLevel() {
		let wrongRank = this.ranks.ranksCheck(this.meta.data.level).wrongRank
		let correctRank = this.ranks.ranksCheck(this.meta.data.level).correctRank
		wrongRank == undefined ? null : this.message.guild.member(this.message.author.id).removeRole(wrongRank)
		return this.message.guild.member(this.message.author.id).addRole(correctRank)
	}

	/**
	 * 	Check for exp booster ticket.
	 * 	If there's any, assign to the total boost.
	 * 	@ticketBuffs
	 */
	async ticketBuffs() {
		try {
			//  Extract required data
			const { expbooster, expbooster_duration } = this.meta.data

			//  skip if user doesn't have any booster that currently active.
			if (!expbooster) return
			let percentage = expbooster.replace(/ *\([^)]*\) */g, ``)
			let limitduration = booster[percentage][/\(([^)]+)\)/.exec(expbooster)[1]]
			let boosterStillValid = expbooster_duration && limitduration - (Date.now() - expbooster_duration) > 0

			//	Notify user if their booster is expired.
			if (!boosterStillValid) {
				this.db.resetExpBooster()
				this.reply(this.code.BOOSTER.EXP_EXPIRED, {
					field: this.meta.author,
					socket: [
						this.data.name(this.meta.author.id),
						expbooster
					]
				})
				return this.logger.info(`${this.meta.author.tag} ${expbooster} EXP booster has expired today.`)
				
			}
			
			this.exp_factor += booster[percentage].multiplier
		}
		catch (e) {
			return this.logger.error(`Failed to check EXP booster on ${this.meta.author.tag}. > ${e}`)
		}
	}

}

module.exports = Experience
