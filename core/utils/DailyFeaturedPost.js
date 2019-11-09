const databaseManager = require(`./databaseManager.js`)
const db = new databaseManager()

class DailyFeaturedPost {
    constructor(bot) {
        this.bot = bot
        this.logger = this.bot.logger
        this.active = false // on/off switch
        this.dailyFeaturedChannel = `642829967176237061` //gen1
    }

    async loop() {
        while(this.active) {
            try {
                await this.delay(1*60*60*1000)
                await this.run()
                await this.delay(70*1000)
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
        let date = (new Date()).getTime()
        let query = Object.values(await this.queries(date))
        this.bot.channels.get(this.dailyFeaturedChannel).fetchMessages(query).then(msg=>{
            msg.delete()
        })
    }

    async delay(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms) })
    }
}

module.exports = DailyFeaturedPost
