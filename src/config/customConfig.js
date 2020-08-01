/**
 * Handles user-related data request and changes
 * @since 6.0.0
 */
class config {
    /**
     * In order to add a config that can be changed, add varible name in @getCustomizableConfigValueOptions and @getCustomizableConfig and follow pattern
     * For reference each string code listed in @getCustomizableConfigValueOptions is listed below:
     * true/false = Boolean
     * channel id, name, or link like #general = @string channel object by id, name or mention\n
     * role id, name, or @ like @admin = @string role object by id, name or mention
     * a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014 = @array of role objects by id or mention
     * a - (to remove) or + (to add) followed by channel id, or link like #general = @array of role objects by id or mention
     * text = @string anything type 
     * number = @String test for only a number inputed
     * For any other codes, add to config command then add to code list above
     */
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
        if (finalConfig.guild_id != guildId) finalConfig.guild_id = guildId

        if (!(finalConfig.post_collect_channels.length > 0)) finalConfig.post_heart_module = false

        if (!finalConfig.post_vip_notification_general_channel) finalConfig.post_vip_notification_module = false

        if (!finalConfig.nitro_role) finalConfig.nitro_notifications = false

        if (!finalConfig.log_channel) finalConfig.WANT_CUSTOM_LOGS = false

        //
        // SET UP RANKS
        //
        finalConfig.ranks = [
            {"LEVEL": 0, "COLOR": `#f1c1db`, "NAME":`Pencilician`},
            {"LEVEL": 5, "COLOR": `#e68fd6`, "NAME":`Crayola Knight`},
            {"LEVEL": 10, "COLOR": `#df7de6`, "NAME":`Crayomancer`},
            {"LEVEL": 15, "COLOR": `#b36ee6`, "NAME":`Brush Wizard`},
            {"LEVEL": 20, "COLOR": `#9d55dd`, "NAME":`Sketch Summoner`},
            {"LEVEL": 25, "COLOR": `#7764ff`, "NAME":`Legendary Doodler`},
            {"LEVEL": 30, "COLOR": `#4a7bfa`, "NAME":`Artifice Master`},
            {"LEVEL": 35, "COLOR": `#288cf2`, "NAME":`Hellbound Painter`},
            {"LEVEL": 40, "COLOR": `#44abff`, "NAME":`Pastel Paladin`},
            {"LEVEL": 45, "COLOR": `#4ed1e7`, "NAME":`Color Elementalist`},
            {"LEVEL": 50, "COLOR": `#59e7ab`, "NAME":`Copic Crusader`},
            {"LEVEL": 60, "COLOR": `#6ff18b`, "NAME":`Earthwork Alchemist`},
            {"LEVEL": 70, "COLOR": `#90ff80`, "NAME":`Canvas Conqueror`},
            {"LEVEL": 85, "COLOR": `#caff7e`, "NAME":`Fame Dweller`},
            {"LEVEL": 100, "COLOR": `#f4e762`, "NAME":`The Creator`},
            {"LEVEL": 180, "COLOR": `#fda746`, "NAME":`Altered Pencilician`}
        ]
        let backupRanks = [
            {"LEVEL": 0, "COLOR": `#f1c1db`, "NAME":`Pencilician`},
            {"LEVEL": 5, "COLOR": `#e68fd6`, "NAME":`Crayola Knight`},
            {"LEVEL": 10, "COLOR": `#df7de6`, "NAME":`Crayomancer`},
            {"LEVEL": 15, "COLOR": `#b36ee6`, "NAME":`Brush Wizard`},
            {"LEVEL": 20, "COLOR": `#9d55dd`, "NAME":`Sketch Summoner`},
            {"LEVEL": 25, "COLOR": `#7764ff`, "NAME":`Legendary Doodler`},
            {"LEVEL": 30, "COLOR": `#4a7bfa`, "NAME":`Artifice Master`},
            {"LEVEL": 35, "COLOR": `#288cf2`, "NAME":`Hellbound Painter`},
            {"LEVEL": 40, "COLOR": `#44abff`, "NAME":`Pastel Paladin`},
            {"LEVEL": 45, "COLOR": `#4ed1e7`, "NAME":`Color Elementalist`},
            {"LEVEL": 50, "COLOR": `#59e7ab`, "NAME":`Copic Crusader`},
            {"LEVEL": 60, "COLOR": `#6ff18b`, "NAME":`Earthwork Alchemist`},
            {"LEVEL": 70, "COLOR": `#90ff80`, "NAME":`Canvas Conqueror`},
            {"LEVEL": 85, "COLOR": `#caff7e`, "NAME":`Fame Dweller`},
            {"LEVEL": 100, "COLOR": `#f4e762`, "NAME":`The Creator`},
            {"LEVEL": 180, "COLOR": `#fda746`, "NAME":`Altered Pencilician`}
        ]
        finalConfig.backupRanks = backupRanks
        finalConfig.custom_ranks = false
        if (typeof finalConfig.set_ranks == `string`) finalConfig.set_ranks = JSON.parse(finalConfig.set_ranks)
        if (finalConfig.set_ranks.length > 0){
            finalConfig.ranks = []
            let newRank = {
                "LEVEL": 0,
                "COLOR": `#f1c1db`,
                "NAME": `Pencilician`
            }
            for (let index = 0; index < finalConfig.set_ranks.length; index++) {
                const element = finalConfig.set_ranks[index]
                let role 
                try {
                    role = this.bot.guilds.get(guildId).roles.get(element.ROLE)
                } catch (error) {
                    finalConfig.ranks = backupRanks
                    break
                }
                if (!role) {
                    finalConfig.ranks = backupRanks
                    break
                }
                newRank = {
                    "LEVEL": element.LEVEL,
                    "COLOR": role.color,
                    "NAME": role.name
                }
                finalConfig.ranks.push(newRank)
            }
            finalConfig.custom_ranks = true
        }
        //
        //
        //

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
            "nickname_changer": `role id, name, or @ like @admin`,
            "post_collect_channels": `a - (to remove) or + (to add) followed by channel id, or link like #general`,
            "post_vip_notification_general_channel": `channel id, name, or link like #general`,
            "post_vip_notification_module": `true/false`,
            "post_heart_module": `true/false`,
            "nitro_role": `role id, name, or @ like @admin`,
            "nitro_notifications": `true/false`,
            "nitro_role_color_changer": `true/false`,
            "featured_requirement": `number`,
            "featured/trending_module": `true/false`,
            "set_ranks": `object like {"LEVEL": "number", "ROLE": "role id, name, or @ like @admin"}`,
            "booster_color_list": `a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014`,
            "annoncement_channel": `channel id, name, or link like #general`,
            "mute_role": `role id, name, or @ like @admin`,
            "event_participant": `role id, name, or @ like @admin`,
            "vip_artcoin_package": `number`,
            "booster_color_messages": `channel id followed by a - (to remove) or + (to add) followed by role id, or @ like @admin would look like 7239682694966435453 + 723968269496615014`,
            "booster_colors": `object like {"EMOJI_NAME": "name", "EMOJI_ID": "id", "ROLE": "role id, or @ like @admin"}`,
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
            "nickname_changer": null,
            "post_collect_channels": [],
            "post_vip_notification_general_channel": null,
            "post_vip_notification_module": false,
            "post_heart_module": false,
            "nitro_role": null,
            "nitro_notifications": true,
            "featured_requirement": 10,
            "featured_trending_module": false,
            "set_ranks": [],
            "booster_color_list": [],
            "annoncement_channel": null,
            "mute_role": null,
            "event_participant": null,
            "vip_artcoin_package": 10000,
            "booster_color_messages": [],
            "booster_colors": [],
            "nitro_role_color_changer": false,
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
