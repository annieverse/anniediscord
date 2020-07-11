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
    async setConfig(guildId=`577121315480272908`) {
        let userConfigArray = await this.bot.db.getGuildConfigurations(guildId)
        let userConfig = {}
        for (let index = 0; index < userConfigArray.length; index++) {
            const element = userConfigArray[index]
            userConfig[element.config_code] = element.customized_parameter
        }
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
        if (finalConfig.guild_id != guildId){
            finalConfig.guild_id = guildId
        }

        if (!finalConfig.log_channel){
            finalConfig.WANT_CUSTOM_LOGS = false
        }
        return finalConfig
    }

    get getRequired(){
        return [`guild_id`]
    }

    get getNotCustomizable(){
        return [`modmail_guildId`, `guild_id`]
    }

    get getCustomizableConfigValueOptions(){
        const defaultConfig = {
            "WANT_CUSTOM_LOGS": `true/false`,
            "channelCreate": `true/false`,
            "channelDelete": `true/false`,
            "channelUpdate": `true/false`,
            "channelUpdate_MASTER": `true/false`,
            "channelUpdate_NAME": `true/false`,
            "channelUpdate_TOPIC": `true/false`,
            "channelUpdate_NSFW": `true/false`,
            "channelUpdate_TYPE": `true/false`,
            "channelUpdate_CATEGORY": `true/false`,
            "emojiCreate": `true/false`,
            "emojiDelete": `true/false`,
            "emojiUpdate": `true/false`,
            "emojiUpdate_MASTER": `true/false`,
            "emojiUpdate_NAME": `true/false`,
            "messageDeleteBulk": `true/false`,
            "messageDelete": `true/false`,
            "messageUpdate": `true/false`,
            "messageUpdate_MASTER": `true/false`,
            "messageUpdate_EDITED": `true/false`,
            "roleCreate": `true/false`,
            "roleDelete": `true/false`,
            "roleUpdate": `true/false`,
            "roleUpdate_MASTER": `true/false`,
            "guildBanAdd": `true/false`,
            "guildBanRemove": `true/false`,
            "guildCreate": `true/false`,
            "guildDelete": `true/false`,
            "guildMemberAdd": `true/false`,
            "guildMemberRemove": `true/false`,
            "guildMembersChunk": `true/false`,
            "guildMemberUpdate": `true/false`,
            "guildUnavailable": `true/false`,
            "guildUpdated": `true/false`,
            "modmail_guildId": `channel id, name, or link like #general`,
            "modmail_category": `channel id, name, or link like #general`,
            "modmail_logChannel": `channel id, name, or link like #general`,
            "modmail_plugin": `true/false`,
            "feeds_channel": `channel id, name, or link like #general`,
            "log_channel": `channel id, name, or link like #general`,
            "welcome_module": `true/false`,
            "welcome_text": `text`,
            "welcome_channel": `channel id, name, or link like #general`,
            "welcome_autoRole": `role id, name, or @ like @admin`,
            "welcome_roles": `a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014`,
            /**
             *  -----------------------------------------------------------
             *  This is the command prefix that Annie will be using.
             *  If not defined, it will use `>` as the default prefix.
             *  @STRING
             */
            "prefix": `any prefix you would like the bot to use`,
            "guild_id": `channel id, name, or link like #general`,
        }
        return defaultConfig
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
            "log_channel": null,
            "welcome_module": true,
            "welcome_text": `Welcome To **{{guild}}** {{user}}!`,
            "welcome_channel": null,
            "welcome_autoRole": null,
            "welcome_roles": [],
            /**
             *  -----------------------------------------------------------
             *  This is the command prefix that Annie will be using.
             *  If not defined, it will use `>` as the default prefix.
             *  @STRING
             */
            "prefix": process.env.PREFIX || `>`,
            "guild_id": `577121315480272908`,
        }
        return defaultConfig
    }
}
module.exports = config
