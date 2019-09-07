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
        //  Base amount (10~15)
        this.totalGainedArtcoins = Math.round(Math.random() * (15 - 10 + 1)) + 10
    }


    /**
     *  Default way to gain artcoins from regular message.
     *  @default
     */
    default() {
        this.db.storeArtcoins(this.totalGainedArtcoins)
		this.logger.info(`${this.author.tag} has received ${this.totalGainedArtcoins} AC in ${this.message.channel.name}`)
    }


	/**
	 * 	Give Artcoins on level up
	 * 	@onLevelUp
	 */
	onLevelUp() {

		//	Return if they are still on same rank
		if (this.data.updated.level == this.meta.data.level) return

		// For each level
		for (let i = this.meta.data.level + 1; i <= this.data.updated.level; i++) {
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
					bonusac
				],
				color: this.color.blue
            })
            
            this.logger.info(`${this.author.tag} has levelup to LVL ${updatedlevel} in ${this.message.channel.name}`)
		}
	}
}


module.exports = Artcoins