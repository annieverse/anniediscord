const MessageController = require(`./MessageController`)
/**
 *  Handle art post collection
 *  @collectPost
 */
class collectPost extends MessageController {
    constructor(data) {
        super(data)
        this.defaultEmoji = `❤`

    }


    /**
     *  Running the task
     *  @run
     */
    run() {
        //  Get attachment metadata
        let img = this.data.message.attachments.first()
        //  React the message
        this.data.message.react(this.defaultEmoji)
        //  Save the record
        this.db.registerPost({
            userId: this.data.message.author.id,
            url: img.url,
            location: this.data.message.channel.name
        })
    }


}

module.exports = collectPost