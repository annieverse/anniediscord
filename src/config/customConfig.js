//const json5 = require('json5')
//const fs = require('fs')
//const path = require('path')
/**
 * Handles user-related data request and changes
 * @since 6.0.0
 */
class config {

    /**
     * @param {Object} bot current <AnnieClient> instance object 
     * @param {Object} message current <Message> instance object
     */
    constructor(bot) {
        this.bot = bot
		this.logger = bot.logger
    }

    /**
     * update the config with custom values
     * @param {id} guildId uses support server as default
     */
    setConfig(guildId=`577121315480272908`) {
        let userConfig = this.bot.db.getGuildConfigurations(guildId)

        const defaultConfig = {
            "WANT_CUSTOM_LOGS": false,
            "channelCreate": false,
            "channelDelete": false,
            "channelUpdate": false,
            "channelUpdate_MASTER": false,
            "channelUpdate_NAME": false,
            "channelUpdate_TOPIC": false,
            "channelUpdate_NSFW": false,
            "channelUpdate_TYPE": false,
            "channelUpdate_CATEGORY": false,
            "emojiCreate": false,
            "emojiDelete": false,
            "emojiUpdate": false,
            "emojiUpdate_MASTER": false,
            "emojiUpdate_NAME": false,
            "messageDeleteBulk": false,
            "messageDelete": false,
            "messageUpdate": false,
            "messageUpdate_MASTER": false,
            "messageUpdate_EDITED": false,
            "roleCreate": false,
            "roleDelete": false,
            "roleUpdate": false,
            "roleUpdate_MASTER": false,
            "guildBanAdd": false,
            "guildBanRemove": false,
            "guildCreate": false,
            "guildDelete": false,
            "guildMemberAdd": false,
            "guildMemberRemove": false,
            "guildMembersChunk": false,
            "guildMemberUpdate": false,
            "guildUnavailable": false,
            "guildUpdated": false,
            "modmail_guildId": `459891664182312980`,
            "modmail_category": `507048639747850240`,
            "modmail_logChannel": `460267216324263936`,
            "modmail_plugin": true,
            "feeds_channel": null,
            "log_channel": null,
            "welcome_module": false,
            /**
             *  -----------------------------------------------------------
             *  This is the command prefix that Annie will be using.
             *  If not defined, it will use `>` as the default prefix.
             *  @STRING
             */
            "prefix": process.env.PREFIX || `>`,
            "guild_id": `577121315480272908`,
        }

        const required = [`guild_id`]
        const notCustomizable = [`commands`, `points`, `permissions`, `port`, `dev`, `version`, `modmail_guildId`]

        const finalConfig = Object.assign({}, defaultConfig)

        for (const [prop, value] of Object.entries(userConfig)) {
        if (!defaultConfig.hasOwnProperty(prop) && !notCustomizable.includes(prop)) {
            throw new Error(`Invalid option: ${prop}`)
        }
        finalConfig[prop] = value
        }


        // Make sure all of the required config options are present
        for (const opt of required) {
        if (!finalConfig[opt]) {
            this.logger.error(`Missing required config.json value: ${opt}`)
            process.exit(1)
        }
        }

        if (!finalConfig.log_channel){
            finalConfig.WANT_CUSTOM_LOGS = false
        }

        return finalConfig
    }
}
module.exports = config
