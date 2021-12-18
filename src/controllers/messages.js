const Permission = require(`../libs/permissions`)
const Points = require(`./points`)
const Command = require(`./commands`)
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
        if (this.message.author.bot) return
        this._registerPermission()
        //  Ignore any user interaction in dev environment
        if (this.unauthorizedEnvironment) return
        //  Check user in the database, if doesn't exist, insert a new row with value of current message author's id. Only ran inside guild's field.
        if (!this.isDirectMessage) {
            this.bot.db.validateUser(this.message.author.id, this.guildId, this.message.author.username)
        }
        /** 
         *  -----------------------------------------------------------------
         *  Module Selector
         *  -- minimal
         *  -----------------------------------------------------------------
         */
        //  Check if AR module is enabled.
        if (this.guild.configs.get(`AR_MODULE`).value) new AutoResponder(this.bot, this.message,this.guild)
        //  Check if message is identified as command.
        if (this.message.content.startsWith(this.bot.prefix) && this.message.content.length >= (this.bot.prefix.length + 1)) return new Command({bot:this.bot, message:this.message}).run()
        //  Limit modules in minimal state.
        if (minimal) return
        //  Automatically executing [Points Controller] when no other module requirements are met
        return new Points({bot:this.bot, message:this.message})
    }

    /**
     *  Check if user is not authorized to access the environment
     *  @returns {Boolean}
     */
    get unauthorizedEnvironment() {
        return this.bot.dev && this.message.author.permissions.level < 1 ? true : false
    }

    /**
     * 	Check if user sent the message from DM.
     * 	@returns {Boolean}
     */
    get isDirectMessage() {
        return this.message.channel.type === `dm`
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
}


module.exports = MessageController