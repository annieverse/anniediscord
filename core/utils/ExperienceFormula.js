let booster = require(`./config/ticketbooster`)
let Controller = require(`./MessageController`)
let Artcoins = require(`./artcoinGains`)

/**
 * Experience formula wrapper. Standalone Class.
 * new value -> process -> update.
 * 
 * Please follow the default constructor metadata structure in order to make 
 * the class working as expected
 * 
 * @Experience
 */
class Experience extends Controller {


	constructor(data) {
		super(data)
		this.data = data
		this.bot = data.bot
		this.keyv = data.bot.keyv
		this.applyTicketBuffs = data.applyTicketBuffs
		this.applyCardBuffs = data.applyCardBuffs
		this.exp_factor = data.exp_factor ? data.exp_factor : 1
		this.message = data.message
		this.meta = data.meta
		this.total_gained_exp = data.total_gained_exp
		this.updated = this.data.updated
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
			return this.logger.error(`Failed to check EXP booster on ${this.meta.author.tag}. > ${e.stack}`)
		}
	}


	/**
	 * 	Check if the message is sent by staff with passive ticket boost
	 * 	@ticketBuffs
	 */
	async handlePassiveTicketBoost() {
		if (super.isRaluMsg) {
			this.bot.cards.ralu_card.skills.main.effect.exp = 0.15
			await this.keyv.set(`ralubuff`, `1h`, 3600000)
		} 
		if (super.isNaphMsg) this.db.whiteCatParadise()
	}


	/**
	 * 	Aggregate and automating all the process in this class
	 * 	@runAndUpdate
	 */
	async runAndUpdate() {
		try {
			//this.setupmetaData()
			this.handlePassiveTicketBoost()

			//  Add & calculate bonuses from card if prompted
			
			if (this.applyCardBuffs) {
				var bonus = super.cardBuffs()
				this.exp_factor += bonus.exp
			}
			//  Add & calculate bonuses from ticket if prompted
			if (this.applyTicketBuffs) await this.ticketBuffs()

			//  Calculate overall exp
			await this.updatingExp()
			new Artcoins(this.data).onLevelUp()

			//  Update rank if current rank rank is not equal with the new rank.
			// ! NOT if current level is not equal with new level !
			if (this.rankUp) {
				// Fix wrong rank
				this.ranks.ranksCheck(this.meta.data.level).hasRank ? null : this.message.guild.member(this.message.author.id).addRole(this.ranks.ranksCheck(this.meta.data.level).correctRank)
				if (this.ranks.ranksCheck(this.meta.data.level).rankJump) this.fixLevel

				await this.removeRank()
				await this.addRank()
				this.rankRewards()
			}

			const commanifier = (number = 0) => {
				return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, `,`)
			}
			//	Save record
			this.logger.info(`[${this.message.channel.name}] ${this.author.tag}: received ${this.total_gained_exp} EXP(${(this.exp_factor <= 1 ? 0 : this.exp_factor-2) * 100}% bonus). (${commanifier(this.meta.data.currentexp)} --> ${commanifier(this.updated.currentexp)})`)

		}
		catch (e) {

			//	Catch possible error
			this.logger.error(`Failed to parse exp in ExperienceFormula.js. > ${e.stack}`)

		}

	}

}

module.exports = Experience
