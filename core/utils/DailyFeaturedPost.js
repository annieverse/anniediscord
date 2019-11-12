const databaseManager = require(`./databaseManager.js`)
const db = new databaseManager()

class DailyFeaturedPost {
    constructor(bot) {
        this.bot = bot
        this.logger = this.bot.logger
        this.active = true // on/off switch
        this.dailyFeaturedChannel = `642829967176237061` //gen
    }

    async loop() {
        while(this.active) {
            try {
                await this.delay(1 * 10 * 60 * 1000)
                await this.run()
                await this.delay(1 * 10 * 60 * 1000)
                await this.cleanDB()
            } catch(e) {
                this.logger.error(`Daily Feature Post - Loop broke.`)
                this.logger.error(e.stack)
            }
        }
    }

    async queries(date){
        return await db.getRemoveBy(date)
    }

    async deleteRecord(date) {
        return await db.deleteRecord(date)
    }

    async run() {
        let date = (new Date()).getTime()
        let query = Object.values(await this.queries(date))
        if (query) {
            query.forEach(element=>{
                this.bot.channels.get(this.dailyFeaturedChannel).fetchMessage(element.message_id).then(msg => {
                    msg.delete()
                    this.logger.info(`[DailyFeaturedPost.js] Delete message ${element.message_id}`)
                }).catch(err=> this.logger.error(`[DailyFeaturedPost.js] Delete message ${err}`))
            })
        }
    }

    async cleanDB(){
        let date = (new Date())
        date.setMinutes(date.getMinutes()-5)
        date = date.getTime()
        let query = Object.values(await this.queries(date))
        if (query) {
            await this.deleteRecord(date)
        }
    }

    async delay(ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms) })
    }
}

module.exports = DailyFeaturedPost
