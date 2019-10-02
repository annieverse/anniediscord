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
        this.bot = data.bot
		this.message = data.message
        this.keyv = data.bot.keyv
        this.env = data.bot.env
        this.ranks = new ranksManager(data.bot, data.message)
        this.reply = data.reply
        this.color = data.palette
        this.emoji = data.emoji
        this.code = data.code
        this.meta = data.meta
        //  Optional condition: if data from author(parent) can't be pulled, then use user(child).
        this.author = data.meta.author.username ? data.meta.author : data.meta.author.user
        this.db = data.bot.db.setUser(this.author.id)
        this.logger = data.bot.logger
        this.label = data.label
        this.cd = data.cooldown
        this.getBenchmark = data.bot.getBenchmark
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
        if (!this.message.content.startsWith(env.prefix)) return false
        if (!bot_domain.includes(this.message.channel.id)) return false
        if (this.message.content.length <= env.prefix.length) return false

        return true
    }


    /**
     * 	Check if user has sent the message in exp channel
     * 	@notInExpChannel
     */
    get inExpChannel() {
        if (this.message.content.startsWith(env.prefix) && this.meta.data.annie_card) return true
        if (nonxp_domain.includes(this.message.channel.id) && env.active_exp) return false
        return true
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
     *  Check if it's an art post and sent in an art boosted channel
     *  @isArtPost
     */
    get isBoostedArtPost() {
        return this.message.channel.id==`626927282602377226` && this._hasAttachment() ? true : false
    }


    /**
     *  Check if it's a message by Naph in general
     *  @isArtPost
     */
    get isNaphMsg() {
        //  Bypass in dev mode
        if (env.dev && this.message.author.id==`230034968515051520`) return true
        //  in general and by Naph
        return this.message.channel.id==`459891664182312982` && this.message.author.id==`230034968515051520` ? true : false
    }

    /**
     *  Check if it's a message by Ralu in an art channel
     *  @isArtPost
     */
    get isRaluMsg() {
        return this.bot.cards.ralu_card.skills.main.channel.includes(this.message.channel.id) && this.message.author.id==`91856786293805056` ? true : false
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
        return nonxp_domain.includes(this.message.channel.id) && this.data.gainArtcoins ? false : true
    }


    /**
     *  Global cooldown for message exp/ac gain.
     *  Only active when its prompted.
     *  @isCoolingDown
     */
    async isCoolingDown() {
        if (env.DISABLE_COOLDOWN) return false
        if (!this.cd) return false
        if (await this.keyv.get(this.label)) return true
        await this.keyv.set(this.label, `1`, this.cd)
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



}


module.exports = MessageController