/**
 * Handles AutoResponder Flow.
 * @abstract
 */
class AutoResponder {
    constructor(bot, message, guild) {
        /**
         * Current bot instance.
         * @type {Client}
         */
        this.bot = bot

        /**
         * Current message instance.
         * @type {Message}
         */
        this.message = message

        /**
         * Current guild instance.
         * @type {Guild}
         */
        this.guild = guild

        /**
         * AR cooldown in milliseconds.
         * @type {number}
         */
        this.ARCooldown = 15
        this.execute()
    }

    /**
     * Primary flow
     * @return {void}
     */
    async execute() {
        const fn = `[Library.AutoResponder]`
        //  Reject if guild does not have any registered AR.
        const { isExist, res } = await this.guildAutoResponders()
        if (!isExist) return this.logger.debug(`${fn} no ARs found for GUILD_ID:${this.guild.id}`)
        //  Reject if context doesn't match with guild's registered ARs
        const foundArs = res.filter(ar => ar.trigger.toLowerCase() === this.context)
        if (!foundArs.length) return this.logger.debug(`${fn} AR empty or doesn't match with the registered ones in GUILD_ID:${this.guild.id}`)
        //  Handle if AR still cooldown.
        const ARmeta = foundArs[0]
        const ARCooldownId = `AR_${ARmeta.ar_id}@${this.guild.id}`
        if (await this.bot.isCooldown(ARCooldownId)) return this.logger.debug(`${fn} AR_${ARmeta.ar_id} in GUILD_ID:${this.guild.id} still in cooldown.`)
        this.bot.setCooldown(ARCooldownId, this.ARCooldown)
        //  Send response
        try {
            this.message.channel.send(ARmeta.response)
        }
        //  Handle incase failed to send the response
        catch(e) {
            return this.logger.warn(`${fn} has failed to send AR_${ARmeta.ar_id} response in GUILD_ID:${this.guild.id} due to > ${e.stack}`)
        }
    }

    /**
     * Check if server has registered ARs or not.
     * @return {object}
     */
    async guildAutoResponders() {
        const ars = await this.db.getAutoResponders(this.guild.id)
        return {
            isExist: ars.length > 0 ? true : false,
            res: ars
        }
    }

    /**
     * Logger framework.
     * @type {logger}
     */
    get logger() {
        return this.bot.logger
    }

    /**
     * Database Manager.
     * @type {redis}
     */
    get db() {
        return this.bot.db
    }

    /**
     * Content of the message.
     * @type {string}
     */
    get context() {
        return this.message.content.toLowerCase()
    }

}

module.exports = AutoResponder