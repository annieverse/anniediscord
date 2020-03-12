/**
 * Master/Parent Module that handles EXP and Artcoins
 * @since 6.0.0
 */
class Points {
    constructor(bot, message) {
        this.bot = bot
        this.message = message
    }

    /**
     * 	Check if EXP plugin is enabled.
     * 	@returns {Boolean}
     */
    get isExpActive() {
        return this.bot.plugins.includes(`ACTIVE_EXP`)
    }

    /**
     *  Check if ARTCOINS plugin is enabled.
     * 	@returns {Boolean}
     */
    get isArtcoinsActive() {
        return this.bot.plugins.includes(`ACTIVE_ARTCOINS`)
    }

}

module.exports = Points