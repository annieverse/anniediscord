const Permission = require(`../libs/permissions`)
const Points = require(`./points`)
const Command = require(`./commands`)
const likesHandler = require(`../struct/posts/likesHandler`)

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
        await this.bot.updateConfig(this.message.guild.id)
        this._registerPermission()
        //  Ignore any user interaction in dev environment
        if (this.unauthorizedEnvironment) return

        //  Check user in the database, if doesn't exist, insert a new row with value of current message author's id.
        await this.bot.db.validateUser(this.message.author.id, this.message.guild.id, this.message.author.username)

        /** 
         *  -----------------------------------------------------------------
         *  Module Selector
         *  -- minimal
         *  -----------------------------------------------------------------
         */
        if (this.isCommandMessage) return new Command({bot:this.bot, message:this.message, modmail: false}).run()
        //  Limit modules in minimal state.
        if (minimal) return

        /** 
         *  -----------------------------------------------------------------
         *  Module Selector
         *  -- extended
         *  -----------------------------------------------------------------
         */
        if (this.isDirectMessage) return new Command({bot:this.bot, message:this.message}).runDM()
        if (this.isModmailMessage) return new Command({bot:this.bot, message:this.message, modmail:true}).runDM()
        if (this.isFeedMessage) return new likesHandler.heartHandler(this.data).intialPost()

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
     * 	Check if user has meet the condition for feed post.
     *  Require Database API 
     * 	@returns {Boolean}
     */
    get isFeedMessage() {
        return this.bot.post_collect_channels.includes(this.message.channel.id)
    }

    /**
     * Check if user sent message from modmail channel
     * @returns {Boolean}
     */
    get isModmailMessage(){
        return this.message.channel.parentID == this.bot.modmail_category
    }

    /**
     *  -------------------------------------------------------------------------------
     *  Private Methods
     * -------------------------------------------------------------------------------
     */

    /**
     * Assign user's permission level to <Message> properties.
     * Accessable through <message.author.permissions> afterwards.
     * @returns {StringCode}
     */
    _registerPermission() {
        const userPerm = new Permission(this.message).getUserPermission(this.message.author.id)
        this.message.author.permissions = userPerm
        return `OK`
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