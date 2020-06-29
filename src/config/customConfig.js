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

        const defaultConfig = this.getCustomizableConfig

        const required = this.getRequired
        const notCustomizable = this.getNotCustomizable
        
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
            finalConfig.WANT_CUSTOM_LOGS = true
        }

        return finalConfig
    }

    get getRequired(){
        return [`guild_id`]
    }

    get getNotCustomizable(){
        return [`modmail_guildId`]
    }

    get getCustomizableConfig(){
        const defaultConfig = {
            "WANT_CUSTOM_LOGS": false,
            "channelCreate": true,
            "channelDelete": true,
            "channelUpdate": true,
            "channelUpdate_MASTER": true,
            "channelUpdate_NAME": true,
            "channelUpdate_TOPIC": true,
            "channelUpdate_NSFW": true,
            "channelUpdate_TYPE": true,
            "channelUpdate_CATEGORY": true,
            "emojiCreate": true,
            "emojiDelete": true,
            "emojiUpdate": true,
            "emojiUpdate_MASTER": true,
            "emojiUpdate_NAME": true,
            "messageDeleteBulk": true,
            "messageDelete": true,
            "messageUpdate": true,
            "messageUpdate_MASTER": true,
            "messageUpdate_EDITED": true,
            "roleCreate": true,
            "roleDelete": true,
            "roleUpdate": true,
            "roleUpdate_MASTER": true,
            "guildBanAdd": true,
            "guildBanRemove": true,
            "guildCreate": true,
            "guildDelete": true,
            "guildMemberAdd": true,
            "guildMemberRemove": true,
            "guildMembersChunk": true,
            "guildMemberUpdate": true,
            "guildUnavailable": true,
            "guildUpdated": true,
            "modmail_guildId": `459891664182312980`,
            "modmail_category": `507048639747850240`,
            "modmail_logChannel": `460267216324263936`,
            "modmail_plugin": true,
            "feeds_channel": null,
            "log_channel": `724732289572929728`,
            "welcome_module": true,
            /**
             *  -----------------------------------------------------------
             *  This is the command prefix that Annie will be using.
             *  If not defined, it will use `>` as the default prefix.
             *  @STRING
             */
            "prefix": process.env.PREFIX || `~`,
            "guild_id": `577121315480272908`,
        }
        return defaultConfig
    }
}
module.exports = config
