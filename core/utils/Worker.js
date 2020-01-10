const Controller = require(`./MessageController`)
const Experience = require(`./ExperienceFormula`)
const CollectPost = require(`./collectingArtpost`)
const EventSubmission = require(`./eventSubmissionManager`)
const Portfolio = require(`./portfolioManager`)
const Commands = require(`../modules/commandsHandler`)
const DM = require(`./directMessageInterface`)
const Artcoins = require(`./artcoinGains`)
const ModeratorNotification = require(`./ModeratorNotification`)


/**
 *  Run the check.
 *  Don't change the current statement flow, they are already properly arranged.
 *  @Worker
 */
class Worker extends Controller {
    constructor(data) {
        super(data)
    }


    /**
     *  Basic flow
     *  @default
     */
    async default() {
        //  Ignore any user interaction in dev environment
        if (super.isUserInDevEnvironment) return
        
        //  Ignore if its from a bot user
        if (super.isAuthorBot) return

        //  These are only run on production server
        if (!this.env.dev) {
            //  React and collect if its an art post
            if (super.isArtPost) new CollectPost(this.data).run()
            //  Handle event-submission post
            if (super.isEventSubmission) new EventSubmission(this.data).run()
            //  Handle portfolio post
            if (super.isAddingPortfolio) new Portfolio(this.data).add()
            //  Handle message coming from #verification request
            if (super.isVerificationRequest) new ModeratorNotification(this.data).sendResponse()
        }


        //  Handle direct message
        if (super.isDirectMessage) return new DM(this.data).run()

        //  Handle message that has prefix or bot related.
        if (super.isCommandMessage) return new Commands(this.data).prepare()


        /** -----------------------------------------------------------------
         *  Beyond this point require cooling-down state mechanism.
         *  -----------------------------------------------------------------
         */ 
        if (await super.isCoolingDown()) return

        // Check if Ralu buff ran out (1h). If yes set the exp boost back to 0
        if (!await super.isRaluBuffActive()) this.bot.cards.ralu_card.skills.main.effect.exp = 0

        // Ping hugo if coffee is mentioned
        if (super.pingHugo) return this.message.channel.send(`<@!476391416268849175>`).then(msg=>msg.delete(2000))

        //  Handle experience system
        if (super.inExpChannel) new Experience(this.data).runAndUpdate()     
        
        //  Handle artcoins gaining on regular message
        if (super.isGainingArtcoins) new Artcoins(this.data).runAndUpdate()
    }

}

module.exports = Worker
