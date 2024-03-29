/**
 * Master/Parent Module that handles EXP and Artcoins
 * @since 6.0.0
 */
class Points {
    constructor(client) {
        this.bot = client.bot
        this.message = client.message

        /**
         * A nested configurations and static values for currency.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.currencyConfig = this.bot.points.currency

        /**
         * A nested configurations and static values for exp.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.expConfig = this.bot.points.exp

        /**
         * Uses default log handler
         * @type {external:winston}
         */
        this.logger = this.bot.logger

        /**
         * Uses default localization.
         * @type {object}
         */
        this.locale = this.bot.locale[`en`]
    }

    /**
     *  Default points randomizer.
     *  @param {number} [min=1] the minimum returned number.
     *  @param {number} [max=5] the maximum returned number.
     *  @returns {Boolean}
     */
    randomize(min=1, max=5) {
      return Math.floor(Math.random() * (max - min + 1) + min)
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

    closestValue(needle, array){
        return Math.max.apply(null,array.filter(function(v)
        { return v <= needle }))
    }

    closestPreviousValue(needle, array){
        return Math.max.apply(null,array.filter(function(v)
			{ return v < needle }))
    }
}

module.exports = Points