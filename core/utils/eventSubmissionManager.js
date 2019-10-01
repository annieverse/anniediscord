const { event_lobby } = require(`../modules/config`)
let Controller = require(`./MessageController`)

/**
 *  Handle every submission in event-submission channel
 *  @SubmissionManager
 */
class SubmissionManager extends Controller {
    constructor(data) {
        super(data)
        this.eventTicket = data.message.guild.roles.find(r => r.name === `Event Participant`)
        this.eventLobby = data.bot.channels.get(event_lobby[0])
        this.code = this.code.EVENT_SUBMISSION
    }


    /**
     *  Running task
     *  @run
     */
    run() {
        //  Withdraw ticket
        this.removeTicket()
        //  Give foxie special envelope if they have her card
        if (this.meta.data.foxie_card) {
            //  Send reward
            this.distributeReward()
            //  Special message
            return this.foxieEnvelope()
        }
        //  Else, use regular message
        return this.regularMessage()
    }


    /**
     *  Send special reward to user who has foxie card
     *  @distributeReward
     */
    distributeReward() {
        //this.db.sendTenChocolateBoxes(this.message.author.id)
    }


    /**
     *  Removing ticket after usage
     *  @removeTicket
     */
    removeTicket() {
        this.message.guild.member(this.message.author.id).removeRole(this.eventTicket)
    }

    
    /**
     *  Send special package to user who has foxie card
     *  @foxieEnvelope
     */
    foxieEnvelope() {
        //  Sending message
        this.reply(this.code.FOXIE_ENVELOPE, {
            socket:[
                this.meta.author.username,
                this.emoji(`bongofoxy`)
            ],
            color: this.color.pink,
            field: this.eventLobby,
            notch: true
        })
    }


    /**
     *  Sending regular message after submitting post
     *  @regularMessage
     */
    regularMessage() {
        this.reply(this.code.DEFAULT, {
            socket: [
                this.meta.author.username,
                this.emoji(`AnnieYay`)
            ],
            color: this.color.golden,
            field: this.eventLobby
        })
    }


}

module.exports = SubmissionManager