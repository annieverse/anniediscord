const Controller = require(`./MessageController`)
const Experience = require(`./expManager`)
const CollectPost = require(`./collectingArtpost`)
const EventSubmission = require(`./eventSubmissionManager`)
const Portfolio = require(`./portfolioManager`)
const Commands = require(`../modules/commandsHandler`)
const DM = require(`./directMessageInterface`)
const Artcoins = require(`./artcoinGains`)
const ModeratorNotification = require(`./ModeratorNotification`)

class Worker extends Controller {
    constructor(data) {
        super(data)
    }


    async default() {
        //  Ignore any user interaction in dev environment
        if (super.isUserInDevEnvironment) return
        //  Ignore if its from a bot user
        if (super.isAuthorBot) return

        //  These are only run on production server
        if (!this.config.dev) {
            //  React and collect if its an art post
            if (await super.isArtPost()) new CollectPost(this.data).run()
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
        //  Handle cooling-down state
        if (await super.isCoolingDown()) return
        //  Handle experience point gaining system
        if (super.isExpActive) new Experience(this.data).runAndUpdate()     
        //  Handle artcoins gaining system
        if (super.isArtcoinsActive) new Artcoins(this.data).runAndUpdate()
    }

}

module.exports = Worker
