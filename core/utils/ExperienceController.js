const Experience = require(`./ExperienceFormula`)
const env = require(`../../.data/environment.json`)
const { nonxp_domain } = require(`../modules/config`)

/**
 *  A subset of Experience Class.
 *  Mainly used to handle incoming message from user and calculate the possible gained
 *  experience point.
 *  @ExperienceController
 */
class ExperienceController extends Experience {
    constructor(metadata) {
        super(metadata)
        this.data = metadata
        this.message = metadata.message
        this.id = metadata.message.author.id
    }


    /**
     * 	Parse and update exp. Inherited method from Experience Class.
     * 	@runAndUpdate
     */
    runAndUpdate() {
        super.runAndUpdate()
    }


    /**
     *  Summarize the checks
     *  @UnqualifiedToGetExp
     */
    get unqualifiedToGetExp() {

        //  Calling the conditions
        if (this.isDirectMessage) return console.log(`1`)
        if (this.isAuthorBot) return console.log(`2`)
        if (this.isUserInDevEnvironment) return console.log(`3`)
        if (this.isCommandMessage) return console.log(`4`)
        if (this.notInExpChannel) return console.log(`5`)
        
        //  Passed
        return true

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
        return env.dev && !env.administrator_id.includes(this.id) ? true : false
    }


    /**
     * 	Check if user has used command-type of message
     * 	@isCommandMessage
     */
    get isCommandMessage() {
        return this.message.content.startsWith(env.prefix) ? true : false
    }


    /**
     * 	Check if user has sent the message in non-exp-allowed channel
     * 	@notInExpChannel
     */
    get notInExpChannel() {
        return !nonxp_domain.includes(this.message.channel.id) ? true : false
    }


}


module.exports = ExperienceController