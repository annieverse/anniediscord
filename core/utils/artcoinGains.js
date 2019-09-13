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

        this.db.storeArtcoins(Math.floor(this.total_gained_ac), this.author.id)
		this.logger.info(`${this.author.tag}: received ${this.total_gained_ac} AC in ${this.message.channel.name}`)
		this.logger.info(`${this.author.tag}: received bonus factor of ${this.ac_factor}`)
    }


	/**
	 * 	Give Artcoins on level up
	 * 	@onLevelUp
	 */
	onLevelUp() {
		//	Return if they are still on same level
		if (this.updated.level == this.meta.data.level) return

		// For each level
		for (let i = this.meta.data.level + 1; i <= this.updated.level; i++) {
			const updatedlevel = i
			const bonusac = updatedlevel === 0 ? 35 : 35 * updatedlevel

			// Add AC
			this.db.storeArtcoins(bonusac, this.author.id)

			//	Send levelup message
			this.reply(this.code.LEVELUP, {
				socket: [
					this.emoji(`AnnieYay`),
					this.meta.author,
					updatedlevel,
					bonusac
				],
				color: this.color.blue
            })
            
            this.logger.info(`${this.author.tag}: level up to LVL ${updatedlevel} in ${this.message.channel.name}`)
		}
	}
}


module.exports = Artcoins