const ranksManager = require(`./ranksManager`)
const env = require(`../../.data/environment.json`)
const cards = require(`../utils/cards-metadata.json`)
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
		//	If cooldown is not set, ignore this method.
        if (!this.cd) return false
        if (await this.keyv.get(this.label)) return true
		await this.keyv.set(this.label, `1`, this.cd)
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
                    return booster_type.includes(this.data.skills.main.type) &&
                    this.data.skills.main.effect.status === `active` ?
                        true : false
                }

                set user_channel(userChannel){
                    this.channel = userChannel
                }

                //  Returns true if channel is the correct card's activation channel.
                get true_channel() {
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
                const req = new requirements(cards[key])
                req.user_channel = this.message.channel
                if (req.met_condition) {
                    arr.push(cards[key])
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