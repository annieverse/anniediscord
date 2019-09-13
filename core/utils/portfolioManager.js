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
            location: this.message.channel.name
        })
    }
}

module.exports =Portfolio