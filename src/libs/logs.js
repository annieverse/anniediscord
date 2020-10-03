`use-strict`
const palette = require(`../ui/colors/default.json`)
const Pistachio = require(`../libs/pistachio`)
/**
 *  A centralized system to log discord-related audits
 *  Each logs type will be divided into different methods
 *  @author Pan
 *  @revised by klerikdust
 */
class LogsSystem {
    constructor(data={}) {
        /**
         * Primary meta which includes current client instance, guildId and give type of log
         * @type {object}
         */
        this.data = data

        /**
         * Default log channel in Annie's support server
         * @type {object}
         */
        this.SupportServerLogChannel = data.bot.guilds.cache.get(`577121315480272908`).channels.cache.get(`724732289572929728`)

        /**
         * Current guild's instance
         * @type {object}
         */
        this.guild = data.bot.guilds.cache.get(data.guild.id)

        /**
         * Current message's instance
         * @type {object}
         */
        this.message = data.message

        /**
         * Current client's logger instance
         * @type {external:winston}
         */
        this.logger = data.bot.logger

        /**
         * Current guild's configurations factory
         * @type {map}
         */
        this.configs = this.guild.configs

        /**
         * Instance of pistachio
         * @type {object}
         */
        this.Pistachio = this.makePistachio(data.bot)

		/**
         * The default locale for current command instance
         * @type {object}
         */	
		this.locale = data.bot.locale[`en`]	

        //  Handle if typeOfLog is not provided
        if (!data.typeOfLog) return
        //  Run GUILD_CREATE and GUILD_DELETE in support's server
        if ([`GUILD_CREATE`, `GUILD_DELETE`].includes(data.typeOfLog)) return this[this._configCodeToMethod(data.typeOfLog)]()
        //  Handle if logs_module isn't enabled in the current guild instance
        if (!this.configs.get(`LOGS_MODULE`).value) return console.debug(`fail on logs_module check`)
        //  Handle if logs channel cannot be found
        this.findLogsChannel()
        if (!this.logsChannel) return console.debug(`fail on logs_channel check`)
        //  Run log based on given type
        this[this._configCodeToMethod(data.typeOfLog)]()
    }

    /**
     * A set of searchflow to find the target log channel for the current guild
     * @returns {void}
     */
    findLogsChannel() {
        const fn = `[Logs.findLogsChannel()]`
        //  Find a log channel by custom configuration if available
        const channel = this.guild.channels.cache
        const customLogChannel = channel.get(this.configs.get(`LOGS_CHANNEL`).value)
        if (channel.has(this.configs.get(`LOGS_CHANNEL`))) return this.logsChannel = customLogChannel
        //  Find a log channel by system assumption
        const assumptionLogChannel = channel.find(node => (node.name.toLowerCase() === `logs`) || (node.name.toLowerCase() === `log`))
        if (assumptionLogChannel !== undefined) return this.logsChannel = assumptionLogChannel
        //  Fallback
        this.logger.info(`${fn} fail to find the target log channel for GUILD_ID:${this.guildId}`)
        this.logsChannel = null
        return 
    }

    channelUpdate() {
        const { bot: { logger }, oldChannel, newChannel, bot } = this.data
        if (this.logChannel.guild.id != oldChannel.guild.id) return
        const {channelUpdate_MASTER, channelUpdate_NAME, channelUpdate_TOPIC, channelUpdate_NSFW, channelUpdate_TYPE, channelUpdate_CATEGORY } = bot
        if (!channelUpdate_MASTER) return
        if (channelUpdate_NAME && (oldChannel.name != newChannel.name)) {
            logger.info(`Channel Name Changed: From #${oldChannel.name} To #${newChannel.name}`)
            this.Pistachio.reply(`**Channel Name Changed: From #{{oldChannelName}} To {{newChannelName}}**`, {
                socket: {"oldChannelName": oldChannel.name, 
                    "newChannelName": newChannel},
                field: this.logChannel,
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green,
                author: bot.user,
                header: bot.user.username
            })
        }
        if (channelUpdate_TOPIC && (oldChannel.topic != newChannel.topic)) {
            logger.info(`Channel Topic Changed: For #${newChannel.name}`)
            if (!oldChannel.topic) oldChannel.topic = `nothing`
            if (!newChannel.topic) newChannel.topic = `nothing`
            this.Pistachio.reply(`**Channel Topic Changed: For {{newChannel}}**\n**From:** {{oldTopic}}\n**To:** {{newtopic}}`, {
                socket: {"newChannel": newChannel, "oldTopic": oldChannel.topic, "newtopic": newChannel.topic},
                footer: `ID: ${newChannel.id}`,
                field: this.logChannel,
                timestamp: true,
                color: palette.green,
                author: bot.user,
                header: bot.user.username
            })
        }
        if (channelUpdate_NSFW && (oldChannel.nsfw != newChannel.nsfw)) {
            logger.info(`Channel NSFW status Changed: For #${newChannel.name}`)
            var yes = `Is Now NSFW`
            var no = `Is Not NSFW Anymore`
            this.Pistachio.reply(`**Channel NSFW status Changed: For {{newChannel}}**\n**To:** {{nsfw}}\n`, {
                socket: {"newChannel": newChannel, "nsfw": newChannel.nsfw ? yes : no},
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                field: this.logChannel,
                color: palette.green,
                author: bot.user,
                header: bot.user.username
            })
        }
        if (channelUpdate_TYPE && (oldChannel.type != newChannel.type)) {
            logger.info(`Channel Type Changed: For #${newChannel.name}`)
            this.Pistachio.reply(`**Channel Type Changed: For {{newChannel}}**\n**To:** {{newType}}`, {
                socket: {"newChannel": newChannel, "newType": newChannel.type},
                footer: `ID: ${newChannel.id}`,
                field: this.logChannel,
                timestamp: true,
                color: palette.green,
                author: bot.user,
                header: bot.user.username
            })
        }
        if (channelUpdate_CATEGORY && (oldChannel.parentID != newChannel.parentID)) {
            logger.info(`Channel Category Changed: For #${newChannel.name}`)
            this.Pistachio.reply(`**Channel Category Changed: For {{newChannel}}**\n**From:** {{oldCat}}\n**To:** {{newCat}}`, {
                socket: {"newChannel":newChannel, "oldCat": oldChannel.parentID ? bot.channels.get(oldChannel.parentID) : `No Category`, "newCat": newChannel.parentID ? bot.channels.get(newChannel.parentID) : `No Category`},
                footer: `ID: ${newChannel.id}`,
                field: this.logChannel,
                timestamp: true,
                color: palette.green,
                author: bot.user,
                header: bot.user.username
            })
        }
    }

    channelCreate() {
        const { bot: { logger }, bot, channel } = this.data
        if (!channel || channel.name == `undefined` || channel.name == undefined) return
        if (this.logChannel.guild.id != channel.guild.id) return
        logger.info(`New Channel Created: #${channel.name}`)
        this.Pistachio.reply(`**Channel Created: #{{channelName}}**\n*check audit logs to see who did it*`, {
            socket: {"channelName": channel.name},
            footer: `ID: ${channel.id}`,
            timestamp: true,
            field: this.logChannel,
            color: palette.green,
            author: bot.user,
            header: bot.user.username
        })
    }

    channelDelete() {
        const { bot: { logger }, bot, channel } = this.data
        if (this.logChannel.guild.id != channel.guild.id) return
        logger.info(`Channel Deleted > ${channel.name}`)
        this.Pistachio.reply(`**Channel Deleted: #{{channelName}}**\n*check audit logs to see who did it*`, {
            socket: {"channelName": channel.name},
            footer: `ID: ${channel.id}`,
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            author: bot.user,
            header: bot.user.username
        })
    }

    emojiUpdate() {
        const { bot: { logger }, bot, oldEmoji, newEmoji } = this.data
        const { emojiUpdate_MASTER, emojiUpdate_NAME } = bot
        if (!emojiUpdate_MASTER) return
        if (this.logChannel.guild.id != oldEmoji.guild.id) return
        if (emojiUpdate_NAME && (oldEmoji.name != newEmoji.name)){
            logger.info(`Emoji Name Changed > From: ${oldEmoji.name} To: ${newEmoji.name}`)
            this.Pistachio.reply(`**Emoji Name Changed: From: **{{old}} **To: **{{new}}`, {
                socket: {"old": oldEmoji.name, "new": newEmoji.name},
                timestamp: true,
                field: this.logChannel,
                color: palette.red,
                author: bot.user,
                header: bot.user.username
            })
        }
    }

    emojiCreate() {
        const { bot: { logger }, bot, emoji } = this.data
        if (this.logChannel.guild.id != emoji.guild.id) return
        logger.info(`Emoji Created: ${emoji.name}`)
        this.Pistachio.reply(`**Emoji Created: **{{emoji}}`, {
            socket: {"emoji": emoji.name},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            author: bot.user,
            header: bot.user.username
        })
    }

    emojiDelete() {
        const { bot: { logger }, bot, emoji } = this.data
        if (this.logChannel.guild.id != emoji.guild.id) return
        logger.info(`Emoji Deleted: ${emoji.name}`)
        this.Pistachio.reply(`**Emoji Deleted: **{{emoji}}`, {
            socket: {"emoji":emoji.name},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            author: bot.user,
            header: bot.user.username
        })
    }

    roleUpdate() {
        const { bot: { logger }, bot, oldRole, newRole } = this.data
        const { roleUpdate_MASTER } = bot
        if (!roleUpdate_MASTER) return
        if (this.logChannel.guild.id != newRole.guild.id) return
        if (oldRole.name != newRole.name){
            logger.info(`Role name changed: ${newRole.name}`)
            this.Pistachio.reply(`**Role Name Changed: {{new}}**\n**Old Role: **{{old}}`, {
                socket: {"new":newRole, "old":oldRole.name},
                timestamp: true,
                color: palette.red,
                field: this.logChannel,
                footer: `ID: ${newRole.id}`,
                author: bot.user,
                header: bot.user.username
            })
        }
    }

    roleCreate() {
        const { bot: { logger }, bot, role } = this.data
        if (this.logChannel.guild.id != role.guild.id) return
        logger.info(`Role Created: ${role.name}`)
        this.Pistachio.reply(`**Role Created: {{role}}**`, {
            socket: {"role":role},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${role.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    roleDelete() {
        const { bot: { logger }, bot, role } = this.data
        if (this.logChannel.guild.id != role.guild.id) return
        logger.info(`Role Deleted: ${role.name}`)
        this.Pistachio.reply(`**Role Deleted: @{{role}}**`, {
            socket: {"role":role.name},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${role.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    messageUpdate() {
        const { bot: { logger }, oldMessage, newMessage, bot} = this.data
        const { messageUpdate_MASTER } = bot
        if (!messageUpdate_MASTER) return
        if (newMessage.channel.type ==`dm`) return
        if (this.logChannel.guild.id != newMessage.guild.id) return
        if (oldMessage.content != newMessage.content){
            if (oldMessage.content.length > 1950) oldMessage.content = oldMessage.content.substring(0,1950) + `...`
            logger.info(`Message edited in #${newMessage.channel.name}`)
            this.Pistachio.reply(`**{{author}} Edited their message in: **{{new}}\n**Old: **{{old}}`, {
                socket: {"author":newMessage.author, "new":newMessage.channel, "old":oldMessage.content},
                footer: `ChannelID: ${newMessage.channel.id}`,
                timestamp: true,
                color: palette.red,
                field: this.logChannel,
                header: newMessage.author.username,
                author: newMessage.author
            })
        }
    }

    messageDeleteBulk() {
        const fn = `[Logs.messageDeleteBulk()]`
        //  Handle if message is coming from direct message interface
        if (this.message.channel.type ==`dm`) return
        //  Preventation, incase the current guild instance isn't in the same place as received message id.
        const message = this.data.messages.first()
        if (this.logsChannel.guild.id !== message.guild.id) return
        this.logger.info(`${fn} a bulk of message was deleted from GUILD_ID:${this.guild.id}`)
        return this.Pistachio.reply(this.locale.LOGS.MESSAGE_DELETE_BULK, {
            header: `${this.data.messages.size} messages got bulk deleted by ${this.message.author.username}.`,
            thumbnail: this.message.author.displayAvatarURL(),
            timestamp: true,
            color: `red`,
            field: this.logsChannel,
            socket: {
                channel: this.message.channel,
                content: this.message.content || `???`,
                user: this.message.author
            }
        })
    }

    /**
     * MESSAGE_DELETE event log
     * @returns {Pistachio.reply}
     */
    messageDelete() {
        const fn = `[Logs.messageDelete()]`
        //  Handle if message is coming from bot-typed user
        if (this.message.author.bot) return
        //  Handle if message is coming from direct message interface
        if (this.message.channel.type ==`dm`) return
        //  Preventation, incase the current guild instance isn't in the same place as received message id.
        if (this.logsChannel.guild.id != this.message.guild.id) return
        this.logger.info(`${fn} a message was deleted from GUILD_ID:${this.guild.id}`)
        return this.Pistachio.reply(this.locale.LOGS.MESSAGE_DELETE, {
            header: `A message deleted by ${this.message.author.username}.`,
            thumbnail: this.message.author.displayAvatarURL(),
            timestamp: true,
            color: `red`,
            field: this.logsChannel,
            socket: {
                channel: this.message.channel,
                content: this.message.content || `???`,
                user: this.message.author
            }
        })
    }

    guildBanAdd(){
        const { bot: { logger }, bot, guild, user } = this.data
        if (this.logChannel.guild.id != guild.id) return
        logger.info(`Member Banned From ${guild.id}, ${user}`)
        this.Pistachio.reply(`**Member Banned: **{{user}} - {{name}}`, {
            socket: {"user":user, "name":user.username},
            timestamp: true,
            color: palette.red,
            field: this.logChannel,
            footer: `ID: ${user.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildBanRemove() {
        const { bot: { logger }, bot, guild, user } = this.data
        if (this.logChannel.guild.id != guild.id) return
        logger.info(`Member Ban revoked From ${guild.id}, ${user}`)
        this.Pistachio.reply(`**Member Ban revoked: **{{user}} - {{name}}`, {
            socket: {"user":user, "name":user.username},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${user.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    async guildCreate() {
        const { bot: { logger, locale, prefix, supportServer }, guild } = this.data
        const guildCode = `**${guild.id}@${guild.name}**`

        logger.info(`New guild joined ${guildCode}`)
        this.Pistachio.reply(`I've been invited to **${guildCode}** guild! ${this.Pistachio.emoji(`AnnieHype`)}`, {
            color: `lightgreen`,
            field: this.SupportServerLogChannel
        })

        const afterInvitationMessage = (targetChannel={}) => {
             return this.Pistachio.reply(locale[`en`].LOGS.GUILDCREATE.AFTER_INVITATION, {
                image: `https://user-images.githubusercontent.com/42025692/89634706-006a8700-d8d0-11ea-9bdc-bf91a46f3661.png`,
                prebuffer: true,
                field: targetChannel,
                color: `crimson`,
                socket: {
                    wiki: `https://github.com/klerikdust/anniediscord/wiki`,
                    prefix: prefix,
                    emoji: this.Pistachio.emoji(`AnnieSmile`),
                    supportServer: supportServer
                }
            })
        }

        try {
            let owner = guild.owner
            return afterInvitationMessage(owner)
        } catch (e) {
            return logger.info(`Fail to send AFTER_INVITATION message to owner of GUILD_ID ${guild.id}`)
        }
    }

    guildDelete() {
        const { bot: { logger }, bot, guild } = this.data
        logger.info(`Guild Left ${guild.id}`)
        this.Pistachio.reply(`**Guild Left: **{{id}} - {{name}}`, {
            socket: {"id":guild.id, "name":guild.name},
            timestamp: true,
            color: palette.red,
            field: this.SupportServerLogChannel,
            footer: `ID: ${guild.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildUpdate() {
        const { bot: { logger }, bot, oldGuild, newGuild } = this.data
        if (this.logChannel.guild.id != newGuild.id) return
        if (oldGuild.name != newGuild.name){
            logger.info(`Guild Name change ${oldGuild.name} => ${newGuild.name} | ${newGuild.id}`)
            this.Pistachio.reply(`**Guild Name change: **{{old}} -> {{new}}`, {
                socket: {"old":oldGuild.name, "new":newGuild.name},
                timestamp: true,
                color: palette.red,
                field: this.logChannel,
                footer: `ID: ${newGuild.id}`,
                author: bot.user,
                header: bot.user.username
            })
        }
        if (oldGuild.region != newGuild.region) {
            logger.info(`Guild region change ${oldGuild.region} => ${newGuild.region} | ${newGuild.id}`)
            this.Pistachio.reply(`**Guild region change: **{{old}} -> {{new}}`, {
                socket: {"old":oldGuild.region, "new":newGuild.region},
                timestamp: true,
                color: palette.red,
                field: this.logChannel,
                footer: `ID: ${newGuild.id}`,
                author: bot.user,
                header: bot.user.username
            })
        }
    }

    guildMemberAdd(){
        const { bot: { logger }, bot, member } = this.data
        if (this.logChannel.guild.id != member.guild.id) return
        logger.info(`Member Joined ${member.guild.id}, ${member}`)
        this.Pistachio.reply(`**Member Joined: **{{member}} - {{username}}`, {
            socket: {"member":member, "username":member.user.username},
            timestamp: true,
            color: palette.green,
            field: this.logChannel,
            footer: `ID: ${member.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildMemberRemove(){
        const { bot: { logger }, bot, member } = this.data
        if (this.logChannel.guild.id != member.guild.id) return
        if (!member.bannable) return
        logger.info(`Member Left ${member.guild.id}, ${member}`)
        this.Pistachio.reply(`**Member Left: **{{member}} - {{username}}`, {
            socket: {"member":member, "username":member.user.username},
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${member.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildMemberUpdate(){
        const { bot: { logger }, bot,oldMember, newMember } = this.data
        if (this.logChannel.guild.id != newMember.guild.id) return
        if(oldMember.nickname != newMember.nickname){
            logger.info(`Nick name change ${oldMember.id} -> ${newMember.nickname}`)
            this.Pistachio.reply(`** {{member}} nickname change: **{{old}} - {{new}}`, {
                socket: {"member":newMember, "old":oldMember.nickname, "new":newMember.nickname},
                timestamp: true,
                field: this.logChannel,
                color: palette.red,
                footer: `ID: ${newMember.id}`,
                author: bot.user,
                header: bot.user.username
            })
        }
    }

    guildMembersChunk(){
        const { bot: { logger }, bot, members, guild } = this.data
        if (this.logChannel.guild.id != members.first().guild.id) return
        logger.info(`Members from ${guild.id}, ${guild.name}`)
        this.Pistachio.reply(`** {{amount}} Members from: **{{id}} - {{name}}`, {
            socket: {"amount":members.length, "id":guild.id, "name":guild.name},
            timestamp: true,
            field: this.logChannel,
            color: palette.green,
            footer: `ID: ${guild.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    /**
     * Parsing CONFIG_CODE case into configCode.
     * @param {string} [configCode=``] target config code to parse from
     * @author klerikdust
     * @returns {string}
     */
    _configCodeToMethod(configCode=``) {
        if (!configCode) throw new TypeError(`[Logs._configCodeToMethod()] parameter 'configCode' must be a valid string.`)
        let targets = []
        configCode = configCode.toLowerCase()
        for (let i=0; i<configCode.length; i++) {
            if (configCode[i] === `_`) {
                targets.push(`_${configCode[i + 1]}`) 
            }
        }
        for (let x=0; x<targets.length; x++) {
            configCode = configCode.replace(targets[x], targets[x].charAt(1).toUpperCase())
        }
        return configCode
    }

    /**
     * Initializing Pistachio's class instance
     * @param {object} [bot] current client's instance
     * @returns {class}
     */
    makePistachio(bot){
        return new Pistachio({bot})
    }
}


module.exports = LogsSystem