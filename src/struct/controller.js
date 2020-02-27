const Experience = require(`./expManager`)
const CollectPost = require(`./collectingArtpost`)
const EventSubmission = require(`./eventSubmissionManager`)
const Portfolio = require(`./portfolioManager`)
const Commands = require(`../modules/commandsHandler`)
const DM = require(`./directMessageInterface`)
const Artcoins = require(`./artcoinGains`)
const ModeratorNotification = require(`./ModeratorNotification`)

/**
 *  @classdesc Centralized Controller for message related.
 *  Mainly used to handle incoming message from user and calculate the possible actions
 *  such as exp/post/event.
 */
class MessageController {
    constructor(data) {
        this.data = data
        this.bot = data.bot
		this.message = data.message
        this.keyv = data.bot.keyv
        this.reply = data.reply
        this.config = data.bot.config
        this.color = data.palette
        this.emoji = data.emoji
        this.code = data.code
        this.meta = data.meta
        this.author = data.meta.author.username ? data.meta.author : data.meta.author.user
        this.db = data.bot.db.setUser(this.author.id)
        this.logger = data.bot.logger
        this.moduleID = `MSG_${data.message.author.id}`
        this.cd = data.cooldown
        this.getBenchmark = data.bot.getBenchmark
    }


    async defaultFlow() {
        //  Ignore any user interaction in dev environment
        if (this.isUserInDevEnvironment) return
        //  Ignore if its from a bot user
        if (this.isAuthorBot) return

        //  These are only run on production server
        if (!this.config.dev) {
            //  React and collect if its an art post
            if (await this.isArtPost()) new CollectPost(this.data).run()
            //  Handle event-submission post
            if (this.isEventSubmission) new EventSubmission(this.data).run()
            //  Handle portfolio post
            if (this.isAddingPortfolio) new Portfolio(this.data).add()
            //  Handle message coming from #verification request
            if (this.isVerificationRequest) new ModeratorNotification(this.data).sendResponse()
        }

        //  Handle direct message
        if (this.isDirectMessage) return new DM(this.data).run()
        //  Handle message that has prefix or bot related.
        if (this.isCommandMessage) return new Commands(this.data).prepare()


        /** -----------------------------------------------------------------
         *  Beyond this point require cooling-down state mechanism.
         *  -----------------------------------------------------------------
         */ 
        //  Handle cooling-down state
        if (await this.isCoolingDown()) return
        //  Handle experience point gaining system
        if (this.isExpActive) new Experience(this.data).runAndUpdate()     
        //  Handle artcoins gaining system
        if (this.isArtcoinsActive) new Artcoins(this.data).runAndUpdate()
    }


    /**
     * 	@description Check if user sent the message from DM.
     * 	@returns {Boolean}
     */
    get isDirectMessage() {
        return this.message.channel.type === `dm`
    }

    /**
     * 	@description Check if user is a bot.
     * 	@returns {Boolean}
     */
    get isAuthorBot() {
        return this.message.author.bot
    }

    /**
     * 	@description Check if user has used command-type of message and sent in bot-allowed channel
     * 	@returns {Boolean}
     */
    get isCommandMessage() {
        if (!this.message.content.startsWith(this.config.prefix)) return false
        if (this.message.content.length <= this.config.prefix.length) return false
        return true
    }


    /**
     *  -------------------------------------------------------------------------------
     *  EXP, ARTCOINS and COOLDOWN STATE checks
     * -------------------------------------------------------------------------------
     */

    /**
     *  @description Global cooldown for message exp/ac gain.
     * 	@returns {Boolean}
     */
    async isCoolingDown() {
        if (this.config.plugins.includes(`DISABLE_COOLDOWN`)) return false
        if (!this.cd) return false
        if (await this.keyv.get(this.moduleID)) return true
        await this.keyv.set(this.moduleID, `1`, this.cd)
        return false
    }

    /**
     * 	@description Check if EXP plugin is enabled.
     * 	@returns {Boolean}
     */
    get isExpActive() {
        return this.config.plugins.includes(`ACTIVE_EXP`)
    }

    /**
     *  @description Check if ARTCOINS plugin is enabled.
     * 	@returns {Boolean}
     */
    get isArtcoinsActive() {
        return this.config.plugins.includes(`ACTIVE_ARTCOINS`)
    }


    /**
     *  -------------------------------------------------------------------------------
     *  Art-post methods
     * -------------------------------------------------------------------------------
     */

    /**
     *  @description Check if message has an attachment.
     * 	@returns {Boolean}
     */
    hasAttachment() {
        try {
            return this.message.attachments.first().id ? true : false
        }
        catch (e) {
            return false
        }
    }

    /**
     *  @description Check if it's an art post and sent in artfeeds channel
     *  @returns {Boolean}
     */
    async isArtPost() {
        //  Skip if message not containing any attachment
        if (!this.hasAttachment()) return false
        //  Fetching guild's artfeeds configuration.
        const channels = await this.db.getArtFeedsLocation(this.message.guild.id)
        if (!channels) return false

        return channels.includes(this.message.channel.id)
    }


    /**
     *  @description Check if user intent is to setup portfolio work. Thiw will be automatically recorded as submitting new art.
     * 	@returns {Boolean}
     */
    get isAddingPortfolio() {
        return this.message.content.includes(`#portfolio`) && this._hasAttachment()
    }


    /**
     *  -------------------------------------------------------------------------------
     *  Specific server features for Anime Artists United (459891664182312980)
     *  -------------------------------------------------------------------------------
     */


    /**
     *  @description Check if it sent to #verification channel
     * 	@returns {Boolean}
     */
    get isVerificationRequest() {
        return [`538843763544555528`].includes(this.message.channel.id)
    }

    /**
     *  @description Check if it sent to event-submission channel
     * 	@returns {Boolean}
     */
    get isEventSubmission() {
        return [`460615254553001994`].includes(this.message.channel.id) && this._hasAttachment()
    }

    /**
     *  Check if it's a message by Naph in general
     *  @isArtPost
     */
    get isNaphMsg() {
        //  Temporarily disabled.
        return false
    }

    /**
     *  Check if it's a message by Ralu in an art channel
     *  @isArtPost
     */
    get isRaluMsg() {
        //  Temporarily disabled.
        return false
    }
    async isRaluBuffActive() {
        if (await this.keyv.get(`ralubuff`)) return true
        return false
    }


    /**
     * 	Get user collected card and find which has buff with exp related.
     * 	And apply the effect.
     * 	@cardBuffs
     */
    cardBuffs() {

        /**
         * 	Find card in user data based on the following requirements:
         * 	1.) The last part of the key must starts with _card (or just "card" also works)
         * 	2.) The value should be true (not null, negative or zero)
         * 	@cardStacks
         */
        const cardStacks = Object
            .entries(this.meta.data)
            .filter(value => value[0].endsWith(`_card`) && value[1])
            .reduce((result, [key, value]) => Object.assign(result, {[key]: value}), {})


        /**
         * 	Legacy code.
         * 	Won't touch yet.
         * 	@get_metadata
         */
        const get_metadata = () => {
            let arr = []

            class requirements {
                constructor(carddata) {
                    this.data = carddata
                }

                //  Returns true if the message should has attachment.
                get attachment_required() {
                    return this.data.skills.main.effect.attachment_only ? true : false
                }


                //  Returns true if the card is active-typing exp booster.
                get exp_multiplier_type() {
                    const booster_type = [`exp_booster`, `exp_ac_booster`]
                    if (this.data.rarity < 5) return false
                    return booster_type.includes(this.data.skills.main.type) &&
                    this.data.skills.main.effect.status === `active` ?
                        true : false
                }

                set user_channel(userChannel){
                    this.channel = userChannel
                }

                //  Returns true if channel is the correct card's activation channel.
                get true_channel() {
                    //  Always return true for "all" categorized channel
                    if (this.data.skills.main.channel.includes(`all`)) return true
                    return this.data.skills.main.channel.includes(this.channel.id) ? true : false
                }


                // Conditional check
                get met_condition() {
                    //  exp_booster in right channel?
                    if (this.exp_multiplier_type && this.true_channel) {
                        return true
                    }

                    //  No conditions have met.
                    else return false
                }

            }

            for (let key in cardStacks) {
                const req = new requirements(this.bot.cards[key])
                req.user_channel = this.message.channel
                if (req.met_condition) {
                    arr.push(this.bot.cards[key])
                }
            }

            return arr

        }

        var bonus = {exp:0, ac:0}

        // Loop over and active the card's skills.
        let filtered_card_stack = get_metadata()
        //  Returns if no buffs are available to use
        if (filtered_card_stack.length < 1) return bonus


        for (let key in filtered_card_stack) {
            //  Get skill metadata
            const skill_data = filtered_card_stack[key].skills.main.effect
            //  Assign bonus
            if (skill_data.exp) bonus.exp += skill_data.exp
            if (skill_data.ac) bonus.ac += skill_data.ac
        }
        return bonus
    }

    get pingHugo(){
        return this.message.content.trim().toLowerCase().includes(`coffee`) ? true : false
    }

    get isInGenTwo(){
        return this.message.channel.id == `548950548343291914` ? true : false
    }


}


module.exports = MessageController