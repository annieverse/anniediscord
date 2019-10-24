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

	/*
	setupmetaData(){
		const formula = (exp) => {
			if (exp < 100) {
				return {
					level: 0,
					maxexp: 100,
					nextexpcurve: 100
				}
			}

			//exp = 100 * (Math.pow(level, 2)) + 50 * level + 100
			//lvl = Math.sqrt(4 * exp - 375) / 20 - 0.25
			var level = Math.sqrt(4 * exp - 375) / 20 - 0.25
			level = Math.floor(level)
			var maxexp = 100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100
			var minexp = 100 * (Math.pow(level, 2)) + 50 * level + 100
			var nextexpcurve = maxexp - minexp
			level = level + 1

			return {
				level: level,
				maxexp: maxexp,
				nextexpcurve: nextexpcurve
			}
		}
		const accumulatedCurrent = Math.floor(this.meta.data.currentexp)
		const main = formula(accumulatedCurrent)
		this.meta.data.level = main.level
		this.meta.data.maxexp = main.maxexp
		this.meta.data.nextexpcurve = main.nextexpcurve
	}
	*/

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
	updatingExp() {
		/**
         * Main experience formula used in Annie's level system
         * @param {Integer} currexp current exp
         * @param {Integer} level current level
         * @param {Integer} maxexp current max exp/cap exp
         * @param {integer} nextexpcurve current curve exp until next exp cap
         * @formula
         */
		const formula = (exp) => {
			if (exp < 100) {
				return {
					level:0,
					maxexp:100,
					nextexpcurve:100
				}
			}

			//exp = 100 * (Math.pow(level, 2)) + 50 * level + 100
			//lvl = Math.sqrt(4 * exp - 375) / 20 - 0.25
            var level = Math.sqrt(4 * exp - 375) / 20 - 0.25
			level = Math.floor(level)
            var maxexp = 100 * (Math.pow(level + 1, 2)) + 50 * (level + 1) + 100
            var minexp = 100 * (Math.pow(level, 2)) + 50 * level + 100
            var nextexpcurve = maxexp - minexp
			level = level + 1

			return {
            	level:level,
				maxexp:maxexp,
				nextexpcurve:nextexpcurve
			}
        }
		//  Apply bonus if available
		this.total_gained_exp = this.total_gained_exp * this.exp_factor
		//  Apply boost if artwork in art channel
		if (super.isArtPost) this.total_gained_exp = this.total_gained_exp * 10


		const accumulatedCurrent = Math.floor(this.total_gained_exp + this.meta.data.currentexp)
		const main = formula(accumulatedCurrent)
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
			if (!this.applyCardBuffs) {
				var bonus = super.cardBuffs()
				this.exp_factor += bonus.exp
			}
			//  Add & calculate bonuses from ticket if prompted
			if (this.applyTicketBuffs) await this.ticketBuffs()

			// Fix wrong rank
			this.ranks.ranksCheck(this.meta.data.level).hasRank ? null : this.message.guild.member(this.message.author.id).addRole(this.ranks.ranksCheck(this.meta.data.level).correctRank)
			if (this.ranks.ranksCheck(this.meta.data.level).rankJump) this.fixLevel

			//  Calculate overall exp
			await this.updatingExp()
			new Artcoins(this.data).onLevelUp()

			//  Update rank if current rank rank is not equal with the new rank.
			// ! NOT if current level is not equal with new level !
			if (this.rankUp) {
				await this.removeRank()
				await this.addRank()
			}

			//	Save record
			this.logger.info(`[${this.message.channel.name}] ${this.author.tag}: received ${this.total_gained_exp} EXP(${(this.exp_factor === 1 ? 0 : this.exp_factor-2) * 100}% bonus). (${this.data.commanifier(this.meta.data.currentexp)} --> ${this.data.commanifier(this.updated.currentexp)})`)

		}
		catch (e) {

			//	Catch possible error
			this.logger.error(`Failed to parse exp in ExperienceFormula.js. > ${e.stack}`)

		}

	}

}

module.exports = Experience
