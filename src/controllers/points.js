const Currency = require(`../libs/currency`)

/**
 * Centralized Controller to handle incoming point request
 * @since 6.0.0
 * @param {object} [data={}] supplied data from <MessageController>.
 */
class PointController {
	constructor(data={}) {
        this.client = data
        this.bot = data.bot
        this.message = data.message

        /**
         * The default identifier for current instance.
         * @type {string}
         */
        this.moduleID = `POINTS_${data.message.author.id}_${data.message.guild.id}`
		this.run()
	}

    /**
     * Running Point Controller. Preparing exceptor on several cases before executing the EXP and CURRENCY module.
     * @returns {void}
     */
	async run() {
        if (await this.bot.isCooldown(this.moduleID)) return
		if (this.isExpActive) {
            try {
                this.bot.experienceLibs(this.message.member, this.message.guild, this.message.channel, (key) => this.bot.localization.findLocale(key)).execute()
            } catch (error) {
                this.bot.logger.error(`Error in PointController Experience execution: ${error.message}`)
            }
        }
        if (this.isCurrencyActive) new Currency(this.client).execute()
        this.bot.setCooldown(this.moduleID, this.bot.points.cooldown)
	}

    /**
     * 	Check if EXP plugin is enabled.
     * 	@type {boolean}
     */
    get isExpActive() {
        return this.bot.plugins.includes(`ACTIVE_EXP`)
    }

    /**
     *  Check if ARTCOINS plugin is enabled.
     * 	@type {boolean}
     */
    get isCurrencyActive() {
        return this.bot.plugins.includes(`ACTIVE_ARTCOINS`)
    }
}

module.exports = PointController