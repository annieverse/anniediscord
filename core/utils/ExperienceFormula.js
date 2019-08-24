const ranksManager = require(`./ranksManager`)
const databaseManager = require(`./databaseManager`)
const formatManager = require(`./formatManager`)
const palette = require(`./colorset.json`)
const booster = require(`./config/ticketbooster`)
let cards = require(`../utils/cards-metadata.json`)

/**
 * Experience formula wrapper. Standalone Class.
 * new value -> process -> update.
 * 
 * @Experience
 */
class Experience {

	constructor(metadata = {
		applyTicketBuffs: false,
		applyCardBuffs: false,
		cardCollections: {},
		bonus: 1,
		bot: {},
		user: {},
		message: {
			author: {
				id: ``,
				tag: ``,
				username: ``
			},
			guild: {}
		},
		total_gained: 0,
		updated: {
			currentexp: 0,
			level: 0,
			maxexp: 0,
			nextexpcurve: 0
		},
		user: {
			currentexp: 0,
			level: 0,
			maxexp: 0,
			nextexpcurve: 0
		}
	}) {
		this.data = metadata
		this.message = metadata.message
		this.ranks = new ranksManager(metadata.bot, metadata.message)
		this.db = new databaseManager(metadata.message.author.id)

	}

	//  Add new rank if user new exp is above threeshold.
	addRank() {
		this.message.guild.member(this.data.message.author.id).addRole(this.message.guild.roles.find(r => r.name === this.ranks.ranksCheck(this.data.updated.level).title))
	}

	//  Remove user rank if new level gap is greater than ranks threeshold.
	removeRank() {
		const userDuplicateRanks = (this.ranks.ranksCheck(this.data.updated.level).lvlcap)
			.filter(val => val < this.data.updated.level)

		let idpool = []
		for (let i in userDuplicateRanks) {
			idpool.push(((this.ranks.ranksCheck(userDuplicateRanks[i]).rank).id).toString())
		}
		return this.message.guild.member(this.data.message.author.id).removeRoles(idpool)
	}

	//  Register new exp data.
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
		if (this.data.bonus > 0) this.data.total_gained = this.data.total_gained * this.data.bonus
		const accumulatedCurrent = Math.round(this.data.total_gained + this.data.user.currentexp)
		const main = formula(accumulatedCurrent, 0, 0, 150)
		//  Save new data
		this.data.updated.currentexp = accumulatedCurrent
		this.data.updated.level = main.level
		this.data.updated.maxexp = main.b
		this.data.updated.nextexpcurve = main.c

		//  Store new values
		this.db.updateExperienceMetadata(this.data.updated)
	}

	// Add AC (on level up)
	updatingAC() {
		// If new level
		if (this.data.updated.level !== this.data.user.level) {
			// For each level
			for (let i = 0; i < this.data.updated.level - this.data.user.level; i++) {
				// Timeout to not spam Discord's server too much
				setTimeout(() => {
					const updatedlevel = this.data.user.level + i + 1
					const bonusac = () => {
						return updatedlevel === 0 ? 35 : 35 * updatedlevel
					}

					// Add AC
					this.db.storeArtcoins(bonusac())

					// Send message
					const format = new formatManager(this.message)
					format.embedWrapper(palette.halloween, `<:nanamiRinWave:459981823766691840> Congratulations ${this.message.author}!! You are now level **${updatedlevel}** !
                **${bonusac()}** AC has been added to your account.`)

					console.log(`USER:${this.message.author.tag}, LV:${updatedlevel}, CH:${this.message.channel.name}`)
				}, (800))
			}
		}
	}

	// Returns true if new_rank is different from user one.
	get rankUp() {
		let new_rank = this.ranks.ranksCheck(this.data.updated.level).title
		let old_rank = this.ranks.ranksCheck(this.data.user.level).title

		return new_rank !== old_rank ? true : false
	}

	// Apply booster ticket if theres any.
	async ticketBuffs() {

		//  Extract required data
		const { expbooster, expbooster_duration } = this.data.user

		//  skip if user doesn't have any booster that currently active.
		if (!expbooster) return


		let percentage = expbooster.replace(/ *\([^)]*\) */g, ``)
		let limitduration = booster[percentage][/\(([^)]+)\)/.exec(expbooster)[1]]
		let boosterStillValid = expbooster_duration && limitduration - (Date.now() - expbooster_duration) > 0

		//  Assign bonus if booster still active
		if (boosterStillValid) this.data.bonus += booster[percentage].multiplier
	}

	// Apply council's card perks if theres any.
	async cardBuffs() {

		//  Extract card collections 
		const card_stacks = this.data.cardCollections

		// Returns true if user has no cards
		const empty_collections = () => {
			for (let key in card_stacks) {
				if (card_stacks[key]) return false
			}
			return true
		}


		// Remove unneccesary properties.
		const eliminate_nulls = () => {
			for (let key in card_stacks) {
				if (!card_stacks[key]) delete card_stacks[key]
			}
		}

		// Filtering cards
		const get_metadata = () => {
			let arr = []

			class requirements {

				constructor(carddata) {
					this.data = carddata
				}

				//  Returns true if the message should has attachment. 
				get attachment_required() {
					return this.data.skills.main.effect.attachment_only ? true : false
				}


				//  Returns true if the card is active-typing exp booster.
				get exp_multiplier_type() {
					const booster_type = [`exp_booster`, `exp_ac_booster`]
					return booster_type.includes(this.data.skills.main.type) &&
                        this.data.skills.main.effect.status === `active` ?
						true : false
				}

				set user_channel(userChannel){
					this.channel = userChannel
				}

				//  Returns true if channel is the correct card's activation channel.
				get true_channel() {
					return this.data.skills.main.channel.includes(this.channel.id) ? true : false
				}


				// Conditional check
				get met_condition() {
					//  exp_booster in right channel?
					if (this.exp_multiplier_type && this.true_channel) {
						return true
					}

					//  No conditions have met.
					else return false
				}

			}

			for (let key in card_stacks) {
				const req = new requirements(cards[key])
				req.user_channel = this.data.message.channel
				if (req.met_condition) {
					arr.push(cards[key])
				}
			}

			return arr

		}

		//  Returns user has no collections.
		if (empty_collections()) return
		eliminate_nulls()


		// Loop over and active the card's skills.
		let filtered_card_stack = get_metadata()

		//  Returns if no buffs are available to use
		if (filtered_card_stack.length < 1) return


		for (let key in filtered_card_stack) {
			//  Get skill metadata
			const skill_data = filtered_card_stack[key].skills.main.effect
			//  Assign bonus
			if (skill_data.exp) this.data.bonus += skill_data.exp
		}
	}

	// Automate the process
	async runAndUpdate() {
		//  Add & calculate bonuses from card if prompted
		if (this.data.applyCardBuffs) await this.cardBuffs()
		//  Add & calculate bonuses from ticket if prompted
		if (this.data.applyTicketBuffs) await this.ticketBuffs()


		//  Calculate overall exp
		await this.updatingExp()


		//  Update rank if current rank rank is not equal with the new rank.
		if (this.rankUp) {
			await this.removeRank()
			await this.addRank()
		}

		// Add Artcoin on level up
		await this.updatingAC()
	}
}

module.exports = Experience
