const Points = require(`./points`)
/**
 * Sub module of Points. Handling currency systems
 * @author klerikdust
 * @since 6.0.0
 */
class Currency extends Points {
    constructor(client) {
        super(client)

        /**
         * The default multiplier will be `1` or equal to 100%.
         * @since 6.0.0
         * @type {number}
         */
        this.currencyMultiplier = this.currencyConfig.factor
    }

    /**
     *  Running CURRENCY workflow.
     *  @returns {boolean}
     */
    execute() {
        //  Calculate
        this.totalGainedCurrency = this.baseGainedCurrency * this.currencyMultiplier
        //  Update user's currency data.
        this.db.updateInventory({
            itemId: 52,
            value: this.totalGainedCurrency,
            operation: `+`,
            userId: this.message.author.id,
            guildId: this.message.guild.id
        })
        this.logger.info(`[Currency.execute()] [${this.message.guild.id}@${this.message.author.id}] has gained ${this.totalGainedCurrency}AC(${this.currencyMultiplier * 100}%)`)
    }

    /**
     *  Randomizing base gained currency using Point.randomizer() and defined value in `.src/config/points.js`
     *  @type {number}
     */
    get baseGainedCurrency() {
        const [min, max] = this.currencyConfig.baseAmount
        return this.randomize(min, max)
    }

}

module.exports = Currency