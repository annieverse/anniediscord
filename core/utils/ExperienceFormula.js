let booster = require(`./config/ticketbooster`)
let Controller = require(`./MessageController`)
let Artcoins = require(`./artcoinGains`)
const sql = require(`sqlite`)

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
		this.applyTicketBuffs = data.applyTicketBuffs
		this.applyCardBuffs = data.applyCardBuffs
		this.exp_factor = data.exp_factor ? data.exp_factor : 1
		this.message = data.message
		this.meta = data.meta
		this.total_gained_exp = data.total_gained_exp
		this.updated = this.data.updated
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
					nextexpcurve:100 - exp
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

			//	Assign boost if booster still valid
			if (boosterStillValid) this.exp_factor += booster[percentage].multiplier
		}
		catch (e) {
			return
		}
	}




	/**
	 * 	Aggregate and automating all the process in this class
	 * 	@runAndUpdate
	 */
	async runAndUpdate() {

		try {
			if (super.isNaphMsg) {
				sql.all(`
					SELECT userId
					FROM collections
					WHERE naph_card = 1
				`).then((users) => {
				    for (var i in users) {
                        sql.run(`
                            UPDATE userdata
                            SET currentexp = currentexp + 50
                            WHERE userId = "${users[i].userId}"
                        `)
						this.logger.info(`[Naph card boost] ${users[i].userId}: received 50 EXP`)
                    }
                })
			}

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
				await this.removeRank()
				await this.addRank()
			}

			//	Save record
			this.logger.info(`[${this.message.channel.name}] ${this.author.tag}: received ${this.total_gained_exp} EXP(${(this.exp_factor-1) * 100}% bonus). (${this.data.commanifier(this.meta.data.currentexp)} --> ${this.data.commanifier(this.updated.currentexp)})`)

		}
		catch (e) {

			//	Catch possible error
			this.logger.error(`Failed to parse exp in ExperienceFormula.js. > ${e.stack}`)

		}

	}

}

module.exports = Experience
