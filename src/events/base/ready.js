const Topgg = require(`@top-gg/sdk`)
const Reminder = require(`../../libs/reminder`)
const dataCleaner = require(`../../libs/dataCleanup.js`)
const { WebhookClient } = require(`discord.js`)
/**
 * Ready event.
 * @param {Client} annie Current bot/worker instance.
 * @return {void}
 */
module.exports = function ready(annie) {
    annie.db.initializeDb()
    const cleaner = new dataCleaner(annie)
    let current_shard = (annie.guilds.cache.first()).shard.id
    let last_shard = (annie.shard.ids)[(annie.shard.ids).length - 1]
    if (current_shard == last_shard) {
        cleaner.getGuildsMarkedForDeletion()
        setTimeout(async () => await cleaner.deleteBulkGuilds(), 1000)
    }
    annie.registerNode(new Reminder(annie), `reminders`)
    annie.registerGuildConfigurations()
    annie.registerGuildAutoResponders()
    annie.registerUserDurationalBuffs()
    annie.logger.info(`<DEPLOYED> (${annie.getBenchmark(annie.startupInit)})`)
    if (annie.dev) return annie.user.setPresence({ status: `dnd` })
    /**
     * 	--------------------------------------------------
     * 	Configuration for Production
     * 	--------------------------------------------------
     */
    annie.logger.info(`successfully logged in (${annie.getBenchmark(process.hrtime(annie.startupInit))})`)
    //  Registering vote api into client property.
    annie.registerNode(new Topgg.Api(process.env.DBLTOKEN), `dblApi`)
    //  Registering error webhook into client property.
    if (process.env.ERROR_WEBHOOK_URL) annie.registerNode(new WebhookClient({ url: process.env.ERROR_WEBHOOK_URL }), `errorWebhook`)
}
