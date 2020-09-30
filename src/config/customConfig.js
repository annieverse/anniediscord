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
            /*
            if (!defaultConfig.hasOwnProperty(prop) && !notCustomizable.includes(prop)) {
                throw new Error(`Invalid option: ${prop}`)
            }
            */
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
        let backupRanks = finalConfig.ranks

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
                    role = this.bot.guilds.cache.get(guildId).roles.cache.get(element.ROLE)
                } catch (error) {
                    finalConfig.ranks = backupRanks
                    finalConfig.custom_ranks = false
                    break
                }
                if (!role) {
                    finalConfig.ranks = backupRanks
                    finalConfig.custom_ranks = false
                    break
                }
                newRank = {
                    "LEVEL": element.LEVEL,
                    "COLOR": role.hexColor,
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
        return [`modmail_guildId`, `guild_id`,`guildCreate`,`guildDelete`,`guildUnavailable`]
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
            "xp_module": `true/false`,
            "level_up_message": `true/false`,
            "featured_requirement": `number`,
            "featured/trending_module": `true/false`,
            "set_ranks": `object like {"LEVEL": "number", "ROLE": "role id, name, or @ like @admin"}`,
            "booster_color_list": `a - (to remove) or + (to add) followed by role id, or @ like @admin would look like + 723968269496615014`,
            "annoncement_channel": `channel id, name, or link like #general`,
            "mute_role": `role id, name, or @ like @admin`,
            "event_participant": `role id, name, or @ like @admin`,
            "vip_artcoin_package": `number`,
            "booster_color_messages": `channel id followed by a - (to remove) or + (to add) followed by message id would look like 7239682694966435453 + 723968269496615014`,
            "booster_colors": `object like {"EMOJI_NAME": "name", "EMOJI_ID": "id", "ROLE": "role id, or @ like @admin"}`,
            /**
             *  -----------------------------------------------------------
             *  This is the command prefix that Annie will be using.
             *  If not defined, it will use `>` as the default prefix.
             *  @STRING
             */
            "prefix": `any prefix you would like the bot to use`,
            "messageGuildInvite": `invite`,
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
            "xp_module": true,
            "level_up_message": true,
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
            "messageGuildInvite": null,
            "guild_id": `577121315480272908`,
        }
        return defaultConfig
    }

    get availableConfigurations() {
        return [
            {
               /**
                 *  A module that enables Logging System in the guild
                 *  @type {object}
                 */
                name: `LOGS_MODULE`,
                description: `A module that enables Logging System in the guild`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 0
            },
            {
                /**
                 *  The target channel where logs message will be sent in
                 *  @type {object}
                 */
                name: `LOGS_CHANNEL`,
                description: `The target channel where logs message will be sent in`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                  *  A module that enables Logging System in the guild for creation of channels
                  *  @type {object}
                  */
                 name: `CHANNEL_CREATE`,
                 description: `A module that enables Logging System in the guild for creation of channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 1
             },
             {
                /**
                  *  A module that enables Logging System in the guild for deletion of channels
                  *  @type {object}
                  */
                 name: `CHANNEL_DELETE`,
                 description: `A module that enables Logging System in the guild for deletion of channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for updates to existing channels
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES`,
                 description: `A module that enables Logging System in the guild for updates to existing channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel name is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_NAME`,
                 description: `A module that enables Logging System in the guild for when the channel name is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel topic is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_TOPIC`,
                 description: `A module that enables Logging System in the guild for when the channel topic is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel explicient filter is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_NSFW`,
                 description: `A module that enables Logging System in the guild for when the channel explicient filter is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel type is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_TYPE`,
                 description: `A module that enables Logging System in the guild for when the channel type is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel postions is changed into or out of a category
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_CATEGORY`,
                 description: `A module that enables Logging System in the guild for when the channel postions is changed into or out of a category`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji creations
                  *  @type {object}
                  */
                 name: `EMOJI_CREATE`,
                 description: `A module that enables Logging System in the guild for emoji creations`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji deletions
                  *  @type {object}
                  */
                 name: `EMOJI_DELETE`,
                 description: `A module that enables Logging System in the guild for emoji deletions`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji name changes
                  *  @type {object}
                  */
                 name: `EMOJI_UPDATE`,
                 description: `A module that enables Logging System in the guild for emoji name changes`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for events like prune/purge of messages
                  *  @type {object}
                  */
                 name: `MESSAGE_DELETE_BULK`,
                 description: `A module that enables Logging System in the guild for events like prune/purge of messages`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a message is deleted
                  *  @type {object}
                  */
                 name: `MESSAGE_DELETE`,
                 description: `A module that enables Logging System in the guild for when a message is deleted`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a message is edited
                  *  @type {object}
                  */
                 name: `MESSAGE_UPDATE`,
                 description: `A module that enables Logging System in the guild for when a message is edited`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role creations
                  *  @type {object}
                  */
                 name: `ROLE_CREATE`,
                 description: `A module that enables Logging System in the guild for role creations`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role deletions
                  *  @type {object}
                  */
                 name: `ROLE_DELETE`,
                 description: `A module that enables Logging System in the guild for role deletions`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role name, color, or permission changes
                  *  @type {object}
                  */
                 name: `ROLE_UPDATE`,
                 description: `A module that enables Logging System in the guild for role name, color, or permission changes`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for member bans
                  *  @type {object}
                  */
                 name: `GUILD_BAN_ADD`,
                 description: `A module that enables Logging System in the guild for member bans`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for member unbans
                  *  @type {object}
                  */
                 name: `GUILD_BAN_REMOVE`,
                 description: `A module that enables Logging System in the guild for member unbans`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when bot joins a guild
                  *  @type {object}
                  */
                 name: `GUILD_CREATE`,
                 description: `A module that enables Logging System in the guild for when bot joins a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when bot leaves a guild
                  *  @type {object}
                  */
                 name: `GUILD_DELETE`,
                 description: `A module that enables Logging System in the guild for when bot leaves a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a member joins a guild
                  *  @type {object}
                  */
                 name: `GUILD_MEMBER_ADD`,
                 description: `A module that enables Logging System in the guild for when a member joins a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a member leaves a guild
                  *  @type {object}
                  */
                 name: `GUILD_MEMBER_REMOVE`,
                 description: `A module that enables Logging System in the guild for when a member leaves a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a server has an outage
                  *  @type {object}
                  */
                 name: `GUILD_UNAVAILABLE`,
                 description: `A module that enables Logging System in the guild for when a server has an outage`,
                 customizable: false,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a server has a name change
                  *  @type {object}
                  */
                 name: `GUILD_UPDATED`,
                 description: `A module that enables Logging System in the guild for when a server has a name change`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Modmail System in the guild
                  *  @type {object}
                  */
                 name: `MODMAIL_PLUGIN`,
                 description: `A module that enables Modmail System in the guild`,
                 customizable: false,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  Where the logs from a thread are posted for Modmail system
                  *  @type {object}
                  */
                 name: `MODMAIL_LOG_CHANNEL`,
                 description: `Where the logs from a thread are posted for Modmail system`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `460267216324263936`
             },
             {
                /**
                  *  Where the threads form for Modmail system
                  *  @type {object}
                  */
                 name: `MODMAIL_CATEGORY`,
                 description: `Where the threads form for Modmail system`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `507048639747850240`
             },
             {
                /**
                  *  Guild Modmail system is bound to
                  *  @type {object}
                  */
                 name: `MODMAIL_GUILD_ID`,
                 description: `Guild Modmail system is bound to`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `459891664182312980`
             },
             {
                /**
                  *  A module that enables Booster Notifications System in the guild
                  *  @type {object}
                  */
                 name: `VIP_POST_NOTIFICATION_MODULE`,
                 description: `A module that enables Booster Notifications System in the guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  The channel where notifications are posted for the Booster Notifications System
                  *  @type {object}
                  */
                 name: `VIP_POST_NOTIFICATION_CHANNEL`,
                 description: `The channel where notifications are posted for the Booster Notifications System`,
                 customizable: true,
                 allowedTypes: [`string`],
                 value: null
             },
             {
                /**
                  *  The channel where upvoted posts are sent to
                  *  @type {object}
                  */
                 name: `FEED_CHANNEL`,
                 description: `The channel where upvoted posts are sent to`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: null
             },
            {
                /**
                 *  A module that enables Welcomer System in the guild
                 *  @type {object}
                 */
                name: `WELCOMER_MODULE`,
                description: `A module that enables Welcomer System in the guild`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 0
            },
            {
               /**
                 *  The content of the message that going to be displayed when a user has joined guild
                 *  @type {object}
                 */
                name: `WELCOMER_TEXT`,
                description: `The content of the message that going to be displayed when a user has joined guild`,
                customizable: true,
                allowedTypes: [`string`],
                value: `Welcome to **{{guild}}**, {{user}}!`
            },
            {
                /**
                 *  A target channel where welcomer/greeting message will be sent in
                 *  @type {object}
                 */
                name: `WELCOMER_CHANNEL`,
                description: `A target channel where welcomer/greeting message will be sent in`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                 *  A module that automatically assign roles from WELCOMER_ROLES to the newly joined user
                 *  @type {object}
                 */
                name: `WELCOMER_ROLES_MODULE`,
                description: `A module that automatically assign roles from WELCOMER_ROLES_LIST to the newly joined user`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 1
            },
            {
                /**
                 *  A given set of roles when user has joined the guild
                 *  @type {object}
                 */
                name: `WELCOMER_ROLES_LIST`,
                description: `A given set of roles when user has joined the guild`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A given role when someone bought nickname changer item from the shop
                 *  @type {object}
                 */
                name: `NICKNAME_CHANGER_ROLE`,
                description: `A given role when someone bought nickname changer item from the shop`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                 *  A module that enables Heart/Likes System for every user's posted art
                 *  @type {object}
                 */
                name: `POST_MODULE`,
                description: `A module that enables Heart/Likes System for every user's posted art`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 0
            },
            {
                /**
                 *  A list of channels that Annie will be watching for a new post
                 *  @type {object}
                 */
                name: `POST_COLLECTOR_CHANNELS`,
                description: `A list of channels that Annie will be watching for a new post`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A given role when someone has boosted the server
                 *  @type {object}
                 */
                name: `NITRO_ROLE`,
                description: `A given role when someone has boosted the server`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                 *  A module that announce a message when someone has boosted the server
                 *  @type {object}
                 */
                name: `NITRO_NOTIFICATIONS`,
                description: `A module that announce a message when someone has boosted the server`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 1
            },
            {
                /**
                 *  A module that enables Annie's Experience Point System
                 *  @type {object}
                 */
                name: `EXP_MODULE`,
                description: `A module that actives Annie's Experience Point System`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 1
            },
            {
                /**
                 *  A module that sends level-up message when member is leveling up.
                 *  @type {object}
                 */
                name: `LEVEL_UP_MESSAGE`,
                description: `A module that sends level-up message when member is leveling up.`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 1
            },
            {
                /**
                 *  Requirement amount of likes before post gets to trending channel
                 *  @type {object}
                 */
                name: `FEATURED_REQUIREMENT`,
                description: `Requirement amount of likes before post gets to trending channel`,
                customizable: true,
                allowedTypes: [`number`],
                value: 10
            },
            {
                /**
                 *  A module that send user's post to trending channel once reached specific amount of likes
                 *  @type {object}
                 */
                name: `FEATURED_MODULE`,
                description: `A module that send user's post to trending channel once reached specific amount of likes`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 0
            },
            {
                /**
                 *  A list of available ranks that user able to get on every level up
                 *  @type {object}
                 */
                name: `RANKS_LIST`,
                description: `A list of available ranks that user able to get on every level up`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A module that enables a customized role-rank system in the guild.
                 *  @type {object}
                 */
                name: `CUSTOM_RANK_MODULE`,
                description: `A module that enables a customized role-rank system in the guild.`,
                customizable: true,
                allowedTypes: [`number`],
                value: 0
            },
            {
                /**
                 *  A list of role id for the server booster
                 *  @type {object}
                 */
                name: `BOOSTER_COLORS_LIST`,
                description: `A list of role id for the server booster`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A role to be assigned to mute user
                 *  @type {object}
                 */
                name: `MUTE_ROLE`,
                description: `A role to be assigned to mute user`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                 *  A role to be assigned for the event participant
                 *  @type {object}
                 */
                name: `EVENT_PARTICIPANT_ROLE`,
                description: `A role to be assigned for the event participant`,
                customizable: true,
                allowedTypes: [`string`],
                value: null
            },
            {
                /**
                 *  Amount of artcoins to be given to Annie's Donator
                 *  @type {object}
                 */
                name: `DONATOR_ARTCOINS_PACKAGE`,
                description: `Amount of artcoins to be given to Annie's Donator`,
                customizable: false,
                allowedTypes: [`number`],
                value: 100000
            },
            {
                /**
                 *  A list of messages for the booster colors
                 *  @type {object}
                 */
                name: `BOOSTER_COLORS_MESSAGES`,
                description: `A list of messages for the booster colors`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A list of colors to be used as booster's perks
                 *  @type {object}
                 */
                name: `BOOSTER_COLORS`,
                description: `A list of colors to be used as booster's perks`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            },
            {
                /**
                 *  A module to enable dynamic-color changing for a guild's booster role.
                 *  @type {object}
                 */
                name: `NITRO_ROLE_COLOR_CHANGER`,
                description: `A module to enable dynamic-color changing for a guild.`,
                customizable: true,
                allowedTypes: [`number`],
                value: 0
            },
            {
                /**
                 *  This is the command prefix that Annie will be using.
                 *  If not defined, it will use `>` as the default prefix.
                 *  @type {object}
                 */
                name: `PREFIX`,
                description: `A prefix that being used to call Annie's Command.`,
                customizable: true,
                allowedTypes: [`string`],
                value: process.env.PREFIX || `>`
            },
            {
                /**
                 *  Allowing guild invite to be generated.
                 *  @type {object}
                 */
                name: `MESSAGE_GUILD_INVITE`,
                description: `Allowing guild invite to be generated.`,
                customizable: true,
                allowedTypes: [`number`],
                value: 0
            },
            {
                /**
                  *  A module that enables Logging System in the guild for creation of channels
                  *  @type {object}
                  */
                 name: `CHANNEL_CREATE`,
                 description: `A module that enables Logging System in the guild for creation of channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 1
             },
             {
                /**
                  *  A module that enables Logging System in the guild for deletion of channels
                  *  @type {object}
                  */
                 name: `CHANNEL_DELETE`,
                 description: `A module that enables Logging System in the guild for deletion of channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for updates to existing channels
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES`,
                 description: `A module that enables Logging System in the guild for updates to existing channels`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel name is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_NAME`,
                 description: `A module that enables Logging System in the guild for when the channel name is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel topic is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_TOPIC`,
                 description: `A module that enables Logging System in the guild for when the channel topic is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel explicient filter is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_NSFW`,
                 description: `A module that enables Logging System in the guild for when the channel explicient filter is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel type is changed
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_TYPE`,
                 description: `A module that enables Logging System in the guild for when the channel type is changed`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when the channel postions is changed into or out of a category
                  *  @type {object}
                  */
                 name: `CHANNEL_UPDATES_CATEGORY`,
                 description: `A module that enables Logging System in the guild for when the channel postions is changed into or out of a category`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji creations
                  *  @type {object}
                  */
                 name: `EMOJI_CREATE`,
                 description: `A module that enables Logging System in the guild for emoji creations`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji deletions
                  *  @type {object}
                  */
                 name: `EMOJI_DELETE`,
                 description: `A module that enables Logging System in the guild for emoji deletions`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for emoji name changes
                  *  @type {object}
                  */
                 name: `EMOJI_UPDATE`,
                 description: `A module that enables Logging System in the guild for emoji name changes`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for events like prune/purge of messages
                  *  @type {object}
                  */
                 name: `MESSAGE_DELETE_BULK`,
                 description: `A module that enables Logging System in the guild for events like prune/purge of messages`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a message is deleted
                  *  @type {object}
                  */
                 name: `MESSAGE_DELETE`,
                 description: `A module that enables Logging System in the guild for when a message is deleted`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a message is edited
                  *  @type {object}
                  */
                 name: `MESSAGE_UPDATE`,
                 description: `A module that enables Logging System in the guild for when a message is edited`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role creations
                  *  @type {object}
                  */
                 name: `ROLE_CREATE`,
                 description: `A module that enables Logging System in the guild for role creations`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role deletions
                  *  @type {object}
                  */
                 name: `ROLE_DELETE`,
                 description: `A module that enables Logging System in the guild for role deletions`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for role name, color, or permission changes
                  *  @type {object}
                  */
                 name: `ROLE_UPDATE`,
                 description: `A module that enables Logging System in the guild for role name, color, or permission changes`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for member bans
                  *  @type {object}
                  */
                 name: `GUILD_BAN_ADD`,
                 description: `A module that enables Logging System in the guild for member bans`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for member unbans
                  *  @type {object}
                  */
                 name: `GUILD_BAN_REMOVE`,
                 description: `A module that enables Logging System in the guild for member unbans`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when bot joins a guild
                  *  @type {object}
                  */
                 name: `GUILD_CREATE`,
                 description: `A module that enables Logging System in the guild for when bot joins a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when bot leaves a guild
                  *  @type {object}
                  */
                 name: `GUILD_DELETE`,
                 description: `A module that enables Logging System in the guild for when bot leaves a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a member joins a guild
                  *  @type {object}
                  */
                 name: `GUILD_MEMBER_ADD`,
                 description: `A module that enables Logging System in the guild for when a member joins a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a member leaves a guild
                  *  @type {object}
                  */
                 name: `GUILD_MEMBER_REMOVE`,
                 description: `A module that enables Logging System in the guild for when a member leaves a guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a server has an outage
                  *  @type {object}
                  */
                 name: `GUILD_UNAVAILABLE`,
                 description: `A module that enables Logging System in the guild for when a server has an outage`,
                 customizable: false,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Logging System in the guild for when a server has a name change
                  *  @type {object}
                  */
                 name: `GUILD_UPDATED`,
                 description: `A module that enables Logging System in the guild for when a server has a name change`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  A module that enables Modmail System in the guild
                  *  @type {object}
                  */
                 name: `MODMAIL_PLUGIN`,
                 description: `A module that enables Modmail System in the guild`,
                 customizable: false,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  Where the logs from a thread are posted for Modmail system
                  *  @type {object}
                  */
                 name: `MODMAIL_LOG_CHANNEL`,
                 description: `Where the logs from a thread are posted for Modmail system`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `460267216324263936`
             },
             {
                /**
                  *  Where the threads form for Modmail system
                  *  @type {object}
                  */
                 name: `MODMAIL_CATEGORY`,
                 description: `Where the threads form for Modmail system`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `507048639747850240`
             },
             {
                /**
                  *  Guild Modmail system is bound to
                  *  @type {object}
                  */
                 name: `MODMAIL_GUILD_ID`,
                 description: `Guild Modmail system is bound to`,
                 customizable: false,
                 allowedTypes: [`string`],
                 value: `459891664182312980`
             },
             {
                /**
                  *  A module that enables Booster Notifications System in the guild
                  *  @type {object}
                  */
                 name: `VIP_POST_NOTIFICATION_MODULE`,
                 description: `A module that enables Booster Notifications System in the guild`,
                 customizable: true,
                 allowedTypes: [`boolean`],
                 value: 0
             },
             {
                /**
                  *  The channel where notifications are posted for the Booster Notifications System
                  *  @type {object}
                  */
                 name: `VIP_POST_NOTIFICATION_CHANNEL`,
                 description: `The channel where notifications are posted for the Booster Notifications System`,
                 customizable: true,
                 allowedTypes: [`string`],
                 value: null
             },
            {
                /**
                 *  A module that enables User's Post System
                 *  @type {object}
                 */
                name: `POST_MODULE`,
                description: `A module that enables User's Post System`,
                customizable: true,
                allowedTypes: [`boolean`],
                value: 0
            },
            {
                /**
                 *  The target channels where post will be collected
                 *  @type {object}
                 */
                name: `POST_CHANNELS`,
                description: `The target channels where post will be collected`,
                customizable: true,
                allowedTypes: [`array`],
                value: []
            }
        ]
    }
}
module.exports = config
