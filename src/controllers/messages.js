const Permission = require(`../libs/permissions`)
const Points = require(`./points`)
const Command = require(`./commands`)
const likesHandler = require(`../struct/posts/likesHandler`)
const AutoResponder = require(`../libs/autoResponder`)

/**
 * @typedef {ClientPrimaryProps}
 * @property {Object} [client={}] Current <AnnieClient> instance
 * @property {Object} [message={}] Current <Message> instance
 */

/**
 * Centralized Controller for handling incoming messages.
 * Mainly used to handle incoming message from user and calculate the possible actions
 * such as Points/Social Feeds/Commands Module.
 * @since 4.0.1
 * @param {Object} data supplied data from message event.
 */
class MessageController {
    constructor(data = {}) {
        this.moduleID = `MSG_${data.message.author.id}_${data.message.author.id}`
        this.bot = data.bot
        this.message = data.message
        this.permission = data.bot.permissions
        this.userId = data.message.author.id
        this.logger = data.bot.logger
        this.data = data
        this.guildId = this.isDirectMessage ? null : data.message.guild.id
        this.guild = this.isDirectMessage ? null : data.bot.guilds.cache.get(data.message.guild.id)
    }

    /**
     * Running default workflow. In the newer version, each tasks has cooldown checks.
     * @param {boolean} [minimal=false] set this to true to make it only run command-type module.
     * @returns {class}
     */
    async run(minimal=false) {
        /** -----------------------------------------------------------------
         *  Exceptor
         *  -----------------------------------------------------------------
         */
        //  Ignore if its from a bot user
        if (this.isBotUser) return
        this._registerPermission()
        //  Ignore any user interaction in dev environment
        if (this.unauthorizedEnvironment) return
        //  Check user in the database, if doesn't exist, insert a new row with value of current message author's id. Only ran inside guild's field.
        if (!this.isDirectMessage) await this.bot.db.validateUser(this.message.author.id, this.guildId, this.message.author.username)
        /** 
         *  -----------------------------------------------------------------
         *  Module Selector
         *  -- minimal
         *  -----------------------------------------------------------------
         */
        if (this.isARModuleEnabled) new AutoResponder(this.bot, this.message,this.guild)
        if (this.isCommandMessage) return new Command({bot:this.bot, message:this.message}).run()
        //  Limit modules in minimal state.
        if (minimal) return
        /** 
         *  -----------------------------------------------------------------
         *  Module Selector
         *  -- extended
         *  -----------------------------------------------------------------
         */
        if (this.isPostModuleActive) return new likesHandler.heartHandler(this.data).intialPost()
        //  Automatically executing [Points Controller] when no other module requirements are met
        return new Points({bot:this.bot, message:this.message})
    }

    /**
     * Check if server has AR module enabled
     * @return {boolean}
     */
    get isARModuleEnabled() {
        return this.guild.configs.get(`AR_MODULE`).value
    }

    /**
     *  Check if user is not authorized to access the environment
     *  @returns {Boolean}
     */
    get unauthorizedEnvironment() {
        return this.bot.dev && this.message.author.permissions.level < 1 ? true : false
    }

    /**
     *  Check if user is a bot.
     *  @returns {Boolean}
     */
    get isBotUser() {
        return this.message.author.bot
    }

    /**
     * 	Check if user sent the message from DM.
     * 	@returns {Boolean}
     */
    get isDirectMessage() {
        return this.message.channel.type === `dm`
    }

    /**
     * 	Check if user has started the message with prefix
     * 	@returns {Boolean}
     */
    get isCommandMessage() {
        return this.message.content.startsWith(this.bot.prefix) && this.message.content.length >= (this.bot.prefix.length + 1)
    }

    /**
     * 	Check if the current guild has post module enabled
     * 	@returns {number}
     */
    get isPostModuleActive() {
        return this.guild.configs.get(`POST_MODULE`).value
    } 

    /**
     * 	Check if the message is sent to post enabled channels
     *  Require Database API 
     * 	@returns {number}
     */
    get sentInPostChannels() {
        const config = this.guild.configs.get(`POST_CHANNELS`)
        return config.value.includes(this.message.channel.id)
    }

    /**
     *  -------------------------------------------------------------------------------
     *  Private Methods
     * -------------------------------------------------------------------------------
     */

    /**
     * Assign user's permission level to <Message> properties.
     * Accessable through <message.author.permissions> afterwards.
     * @returns {void}
     */
    _registerPermission() {
        const userPerm = new Permission(this.message).getUserPermission(this.message.author.id)
        this.message.author.permissions = userPerm
     }

    /**
     *  -------------------------------------------------------------------------------
     *  Specific server features for Anime Artists United (459891664182312980)
     *  -------------------------------------------------------------------------------
     */

    /**
     *  Check if it sent to #verification channel
     * 	@returns {Boolean}
     */
    get isVerificationRequest() {
        return [`538843763544555528`].includes(this.message.channel.id)
    }

    /**
     *  Check if it sent to event-submission channel
     * 	@returns {Boolean}
     */
    get isEventSubmission() {
        return [`460615254553001994`].includes(this.message.channel.id) && this._hasAttachment()
    }
}


module.exports = MessageController