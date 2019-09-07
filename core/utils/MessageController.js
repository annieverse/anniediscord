const ranksManager = require(`./ranksManager`)
const env = require(`../../.data/environment.json`)
const {
    art_domain,
    nonxp_domain,
    event_submission_domain,
    bot_domain
} = require(`../modules/config`)

/**
 *  Centralized Controller for message related.
 *  Mainly used to handle incoming message from user and calculate the possible actions
 *  such as exp/post/event.
 *  @MessageController
 */
class MessageController {
    constructor(data) {
        this.data = data
		this.message = data.message
		data.bot.db.setUser = data.message.author.id
		this.db = data.bot.db
        this.keyv = data.bot.keyv
        this.env = data.bot.env
        this.ranks = new ranksManager(data.bot, data.message)
        this.reply = data.reply
        this.color = data.palette
        this.emoji = data.emoji
        this.code = data.code
        this.meta = data.meta
        this.author = data.meta.author
        this.logger = data.bot.logger
        this.label = data.label
        this.cd = data.cooldown
    }


    /**
     * 	Check if user sent the message from DM. Returning Boolean.
     * 	@isDirectMessage
     */
    get isDirectMessage() {
        return this.message.channel.type === `dm` ? true : false
    }


    /**
     * 	Check if user is a bot. Returning Boolean.
     * 	@isAuthorBot
     */
    get isAuthorBot() {
        return this.message.author.bot ? true : false
    }


    /**
     * 	Check if user is not authorized in dev mode
     * 	@isUserInDevEnvironment
     */
    get isUserInDevEnvironment() {
        return env.dev && !env.administrator_id.includes(this.message.author.id) ? true : false
    }


    /**
     * 	Check if user has used command-type of message and sent in bot-allowed channel
     * 	@isCommandMessage
     */
    get isCommandMessage() {
        return this.message.content.startsWith(env.prefix) 
        && bot_domain.includes(this.message.channel.id) ? true : false
    }


    /**
     * 	Check if user has sent the message in exp channel
     * 	@notInExpChannel
     */
    get inExpChannel() {
        return nonxp_domain.includes(this.message.channel.id) && env.active_exp ? false : true
    }


    /**
     *  Check if message has an attachment. Returns boolean
     *  @privateMethod
     *  @_hasAttachment
     */
    _hasAttachment() {
        try {
            return this.message.attachments.first().id ? true : false
        }
        catch (e) {
            return false
        }
    }


    /**
     *  Check if it's an art post and sent in art-allowed channel
     *  @isArtPost
     */
    get isArtPost() {
        return art_domain.includes(this.message.channel.id) && this._hasAttachment() ? true : false
    }


    /**
     *  Check if it sent to event-submission channel
     *  @isEventSubmission
     */
    get isEventSubmission() {
        return event_submission_domain.includes(this.message.channel.id) && this._hasAttachment() ? true : false
    }


    /**
     *  Check if user intent is to setup portfolio work
     *  @isAddingPortfolio
     */
    get isAddingPortfolio() {
        return this.message.content.includes(`#portfolio`) && this._hasAttachment() ? true : false
    }


    /**
     *  Check if current action is prompted to gain artcoin
     *  @isAllowedGainArtcoin
     */
    get isGainingArtcoins() {
        return this.data.gainArtcoins ? true : false
    }


    /**
     *  Global cooldown for message exp/ac gain.
     *  Only active when its prompted.
     *  @isCoolingDown
     */
    async isCoolingDown() {
		//	If cooldown is not set, ignore this method.
        if (!this.cd) return false
        if (await this.keyv.get(this.label)) return true
		await this.keyv.set(this.label, `1`, this.cd)
		return false       
    }

}


module.exports = MessageController