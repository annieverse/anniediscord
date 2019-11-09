const databaseManager = require(`./databaseManager.js`)
const db = new databaseManager()

class DailyFeaturedPost {
    constructor(bot) {
        this.bot = bot
        this.logger = this.bot.logger
        this.active = true // on/off switch
        this.dailyFeaturedChannel = `642829967176237061` //gen1
    }

    async loop() {
        while(this.active) {
            try {
                await this.delay(1*60*60*1000)
                await this.run()
            } catch(e) {
                this.logger.error(`Daily Feature Post - Loop broke.`)
                this.logger.error(e)
            }
        }
    }

    async queries(date){
        return await db.getRemoveBy(date)
    }

    async run() {
        let query = Object.values(await this.queries(date))
        if (!query) return
        let date = (new Date()).getTime()
        this.bot.channels.get(this.dailyFeaturedChannel).fetchMessages(query).then(msg=>{
            msg.delete()
        })
    }

    async delay(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms) })
    }
}

module.exports = DailyFeaturedPost
