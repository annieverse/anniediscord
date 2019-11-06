const Controller = require(`../utils/MessageController`)


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
        //  data can be from ExperienceFormula or directly from Worker.js
        this.data = data
        this.bot = data.bot
		this.keyv = data.bot.keyv
		this.ac_factor = data.ac_factor ? data.ac_factor : 1
        this.total_gained_ac = data.total_gained_ac
		this.applyCardBuffs = data.applyCardBuffs
		this.updated = data.updated
		this.meta = data.meta
    }


    /**
     *  Default way to gain artcoins from regular message.
     *  @default
     */
    async runAndUpdate() {
		//  Add & calculate bonuses from card if prompted
		if (this.applyCardBuffs) {
			var bonus = super.cardBuffs()
			this.ac_factor += bonus.ac
			//  Apply bonus if available
			this.total_gained_ac = this.total_gained_ac * this.ac_factor
		}
		if (super.isArtPost) this.total_gained_ac = this.total_gained_ac * 10
		if (super.isBoostedArtPost) this.total_gained_ac = this.total_gained_ac * 2
		if (super.isInGenTwo) this.total_gained_ac = this.total_gained_ac + (this.total_gained_ac*.25) // Add a 25% artcoins when a message is detected in gen2

		this.db.storeArtcoins(Math.floor(this.total_gained_ac))
		this.logger.info(`[${this.message.channel.name}] ${this.author.tag}: received ${this.total_gained_ac} AC(${this.ac_factor === 1 ? 0 : this.ac_factor-2}% bonus). (${this.data.commanifier(this.meta.data.artcoins)} --> ${this.data.commanifier(this.meta.data.artcoins + this.total_gained_ac)})`)
    }


	/**
	 * 	Give Artcoins on level up
	 * 	@onLevelUp
	 */
	onLevelUp() {
		//	Return if they are still on same level
		if (this.updated.level == this.meta.data.level) return

		let isLvlJump = (this.updated.level - this.meta.data.level) > 1 
		if (isLvlJump) {
			const threeshold = this.updated.level - this.meta.data.level
			let bonusac = 0
			//	Accumulate bonus
			for (let i = 0; i<threeshold; i++) bonusac += 35 * (this.meta.data.level + i)

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
				color: this.color.lightblue
			})
		}

		// For each level
		for (let i = this.meta.data.level + 1; i <= this.updated.level; i++) {
			const updatedlevel = i
			const bonusac = updatedlevel === 0 ? 35 : 35 * updatedlevel

			// Add AC
			this.db.storeArtcoins(bonusac)

			//	Send levelup message
			this.reply(this.code.LEVELUP, {
				socket: [
					this.emoji(`AnnieYay`),
					this.meta.author,
					updatedlevel,
					this.emoji(`artcoins`),
					this.data.commanifier(bonusac)
				],
				color: this.color.blue
			})
            
            this.logger.info(`${this.author.tag}: level up to LVL ${updatedlevel} in ${this.message.channel.name}`)
		}
	}
}


module.exports = Artcoins