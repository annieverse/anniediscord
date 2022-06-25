const { MessageEmbed, MessageAttachment} = require(`discord.js`)
class DailyFeaturedPost {
    constructor(bot) {
        this.bot = bot
        this.logger = this.bot.logger
        this.active = true // on/off switch
        this.dailyFeaturedChannel = `642829967176237061` //trending
        this.featuredChannel = `582808377864749056` //featured
        this.messageIds = []
    }

    async loop() {
        while(this.active) {
            try {
                await this.delay(1 * 60 * 60 * 1000)  
                await this.run()
                this.messageIds = []
            } catch(e) {
                this.logger.error(`Daily Feature Post - Loop broke.`)
                this.logger.error(e.stack)
            }
        }
    }

    async queries(date){
        return await this.bot.db.getRemoveBy(date)
    }

    async deleteRecord(date) {
        return await this.bot.db.deleteRecord(date)
    }

    async getMessageArray(){
        var testDay = 1 * 12 * 60 * 60 * 1000 // amount of days * amount of hours * hours * minutes * miliseconds
        var dateNow = Date.now()
        await this.bot.channels.get(this.dailyFeaturedChannel).messages.fetch({limit:100}).then(async messages => {
            let messageArray = messages.keyArray()
            if (messageArray){
                messageArray.forEach(async element => {
                    await this.bot.channels.get(this.dailyFeaturedChannel).messages.fetch(element).then(msg =>{
                        let messageDate = (new Date(msg.createdAt)).getTime()
                        let isMsgReadyToBeDeleted = (dateNow-messageDate)>testDay
                        if (isMsgReadyToBeDeleted) {
                            this.messageIds.push(msg.id)
                            const embed = new MessageEmbed()
                                .setColor(msg.embeds[0].color)
                                .setDescription(msg.embeds[0].description)
                                .attachFiles(new MessageAttachment(msg.embeds[0].image.url, `preview.jpg`))
                                .setImage(`MessageAttachment://preview.jpg`)
                                .setAuthor(msg.embeds[0].author.name, msg.embeds[0].author.iconURL())
                            this.bot.channels.get(this.featuredChannel).send(embed)
                        }
                    })
                })
            }
        })
    }

    async run() {
        await this.getMessageArray()
        if (this.messageIds) this.bot.channels.get(this.dailyFeaturedChannel).bulkDelete(this.messageIds).catch(error=>this.bot.logger.error(`[DailyFeaturedPost.js] Error on bulk delete: ${error}`))
    }

    async delay(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms) })
    }
}

module.exports = DailyFeaturedPost
