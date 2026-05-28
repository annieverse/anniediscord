const Topgg = require(`@top-gg/sdk`)
const Reminder = require(`../../libs/reminder`)
const dataCleaner = require(`../../libs/dataCleanup.js`)
const { WebhookClient } = require(`discord.js`)
/**
 * Ready event.
 * @param {Client} annie Current bot/worker instance.
 * @return {void}
 */
module.exports = async function ready(annie) {
    try {
        annie.db.initializeDb()
        const cleaner = new dataCleaner(annie)
        let current_shard = (annie.guilds.cache.first()).shard.id
        let last_shard = (annie.shard.ids)[(annie.shard.ids).length - 1]
        if (current_shard == last_shard) {
            cleaner.getGuildsMarkedForDeletion()
            setTimeout(async () => await cleaner.deleteBulkGuilds(), 1000)
        }
        annie.registerNode(new Reminder(annie), `reminders`)
        await annie.registerGuildConfigurations()
        await annie.registerGuildAutoResponders()
        await annie.registerUserDurationalBuffs()
        annie.logger.info(`<DEPLOYED> (${annie.getBenchmark(annie.startupInit)})`)
        if (annie.dev) {
            annie.user.setPresence({ status: `dnd` })
            annie.markReadyTasksComplete({ shardIds: annie.shard.ids })
            return
        }
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
        annie.markReadyTasksComplete({ shardIds: annie.shard.ids })
    } catch (error) {
        annie.lockEventProcessing(`ready_initialization_failed`)
        annie.logger.error({
            action: `ready_initialization_failed`,
            msg: error && error.message ? error.message : String(error),
            stack: error && error.stack ? error.stack : null
        })
    }
}
