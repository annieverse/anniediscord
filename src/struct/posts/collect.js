const MessageController = require(`../controller`)
/**
 *  Handle art post collection
 *  @collectPost
 */
class collectPost extends MessageController {
    constructor(data) {
        super(data)
        this.defaultEmoji = `❤`
        this.communityNotificationLabel = `comnotif:${this.data.message.author.id}`

    }
    

    /**
     *  Notify community for Booster user.
     *  @communityNotification
     */
    communityNotification() {
        //  Return if still in cooldown (1h)
        if (this.communityNotificationIsCooldown()) return

        //  Send notification to general. Deletes after 30s.
        this.reply(`**${this.data.message.author.username}** has posted new art in ${this.data.message.channel} !`, {
            deleteIn: 30,
            field: this.data.message.guild.channels.get(`459891664182312982`)
        })

        //  Set cooldown
        this.keyv.set(this.communityNotificationLabel, 1, 3600)
        return this.logger.info(`${this.data.message.author.tag}'s post got notified in #general.`)
    }


    /**
     *  Check if the user has recently posted the art.
     *  @communityNotificationIsCooldown
     */
    async communityNotificationIsCooldown() {
        return await this.keyv.get(this.communityNotificationLabel) ? true : false
    }


    /**
     *  Running the task
     *  @run
     */
    async run() {
        //  Get AttachmentBuilder metadata
        let img = this.data.message.attachments.first()
        //  React the message
        this.data.message.react(this.defaultEmoji)
        //  If user is a VIP user and notification enabled, sent community notification.
        if (this.data.isVIP && this.data.meta.get_notification) this.communityNotification
        //  Save the record
        this.db.registerPost({
            userId: this.data.message.author.id,
            url: img.url,
            location: this.data.message.channel.name,
            description: this.data.message.content
        })
    }


}

module.exports = collectPost