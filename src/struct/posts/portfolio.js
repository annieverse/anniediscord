let Controller = require(`./MessageController`)
/**
 *  Handle user portfolio related
 *  @Portfolio
 */
class Portfolio extends Controller {
    constructor(data) {
        super(data)
        this.url = data.message.attachments.first().url
    }

    /**
     *  Registering post
     *  @add
     */
    add() {
        this.db.registerPost({
            userId: this.meta.author.id,
            url: this.url,
            caption: this.caption,
            channelId: this.message.channel.id,
            guildId: this.message.guild.id
        })
    }
    get caption() {
        //  Return blank caption
        if (!this.message.content) return ``
        //  Chop caption with length exceed 180 characters.
        if (this.message.content.length >= 180) return this.message.content.substring(0, 180) + `. .`

        return this.message.content
    }
}

module.exports = Portfolio