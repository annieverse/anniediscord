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

	constructor(data = {
			datatype: `DEFAULT_MSG`,
			pistachio: require(`./Pistachio`)({}),
			applyTicketBuffs: true,
			applyCardBuffs: true,
			exp_factor: 1,
			user: {},
			bot: {},
			message: {},
			total_gained_exp: data.total_gained_exp,
			updated: {
				currentexp: 0,
				level: 0,
				maxexp: 0,
				nextexpcurve: 0
		}}) {
		super(data)
	}


	/**
	 * 	Add new rank
	 * 	@addRank
	 */
	addRank() {
		this.message.guild.member(this.data.message.author.id).addRole(this.message.guild.roles.find(r => r.name === this.ranks.ranksCheck(this.data.updated.level).title))
	}

	
	/**
	 * 	Removing duplicate rank
	 * 	@removeRank
	 */
	removeRank() {
		const userDuplicateRanks = (this.ranks.ranksCheck(this.data.updated.level).lvlcap)
			.filter(val => val < this.data.updated.level)

		let idpool = []
		for (let i in userDuplicateRanks) {
			idpool.push(((this.ranks.ranksCheck(userDuplicateRanks[i]).rank).id).toString())
		}
		return this.message.guild.member(this.data.message.author.id).removeRoles(idpool)
	}


	/**
	 * 	Calculate and register new exp value based on predefined formula
	 * 	@updatingExp
	 */
	updatingExp() {
		/**
         * Main experience formula used in Annie's level system
         * @param {Integer} x current exp
         * @param {Integer} level current level
         * @param {Integer} b current max exp/cap exp
         * @param {integer} c current curve exp until next exp cap
         * @formula
         */
		const formula = (x, level, b, c) => {
			for (let i = 150; i !== x; i += c) {
				b += c
				c += 200
				level++
				if (i > x) {
					break
				}
			}
			return {
				x: x,
				level: level,
				b: b,
				c: c

			}
		}

		//  Apply bonus if available
		this.data.total_gained_exp = this.data.total_gained_exp * this.data.exp_factor
		//  Apply boost if artwork in art channel
		if (super.isArtPost) this.data.total_gained_exp = this.data.total_gained_exp * 10


		const accumulatedCurrent = Math.floor(this.data.total_gained_exp + this.data.meta.data.currentexp)
		const main = formula(accumulatedCurrent, 0, 0, 150)
		//  Save new data
		this.data.updated.currentexp = accumulatedCurrent
		this.data.updated.level = main.level
		this.data.updated.maxexp = main.b
		this.data.updated.nextexpcurve = main.c

		//temp TODO remove
		this.logger.info(`Old exp: ${this.data.meta.data.currentexp}`)
		this.logger.info(`New exp: ${this.data.updated.currentexp}`)

		//  Store new values
		this.db.updateExperienceMetadata(this.data.updated, this.author.id)
	}


	/**
	 * 	Check if the current rank is same/different with the previous one.
	 * 	Returns Boolean.
	 * 	@rankUp
	 */
	get rankUp() {
		let new_rank = this.ranks.ranksCheck(this.data.updated.level).title
		let old_rank = this.ranks.ranksCheck(this.data.meta.data.level).title

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
			const { expbooster, expbooster_duration } = this.data.meta.data

			//  skip if user doesn't have any booster that currently active.
			if (!expbooster) return

			let percentage = expbooster.replace(/ *\([^)]*\) */g, ``)
			let limitduration = booster[percentage][/\(([^)]+)\)/.exec(expbooster)[1]]
			let boosterStillValid = expbooster_duration && limitduration - (Date.now() - expbooster_duration) > 0

			//	Assign boost if booster still valid
			if (boosterStillValid) this.data.exp_factor += booster[percentage].multiplier
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
			//  Add & calculate bonuses from card if prompted
			if (this.data.applyCardBuffs) {
				var bonus = super.cardBuffs()
				this.data.exp_factor += bonus.exp
			}
			//  Add & calculate bonuses from ticket if prompted
			if (this.data.applyTicketBuffs) await this.ticketBuffs()


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
			this.logger.info(`${this.author.tag} has received ${this.data.total_gained_exp} EXP in ${this.message.channel.name}`)
			this.logger.info(`A bonus factor of ${this.exp_factor} was applied`)
			this.logger.info(`${this.author.tag} now has ${this.data.updated.currentexp} EXP`)

		}
		catch (e) {

			//	Catch possible error
			this.logger.error(`Failed to parse exp in ExperienceFormula.js. > ${e.stack}`)

		}

	}

}

module.exports = Experience
