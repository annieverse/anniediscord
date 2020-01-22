`use-strict`
const palette = require(`../utils/colorset.json`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
const Long = require(`long`)
const Pistachio = require(`../utils/Pistachio`)
/**
 *  Handling log records
 *  @LogsSystem
 */
class LogsSystem {

    constructor(data) {
        this.data = data
        this.logChannel = data.bot.channels.get(`460267216324263936`)
        this.SupportServerLogChannel = data.bot.channels.get(`654967979402067988`)
        this.Pistachio = this.makePistachio(this.data.bot)
    }

    makePistachio(bot){
        return new Pistachio({bot}).bag()
    }

    channelUpdate() {
        const { bot: { logger }, oldChannel, newChannel, bot } = this.data
        if (this.logChannel.guild.id != oldChannel.guild.id) return
        const {channelUpdate_MASTER, channelUpdate_NAME, channelUpdate_TOPIC, channelUpdate_NSFW, channelUpdate_TYPE, channelUpdate_CATEGORY } = logSystemConfig
        if (!channelUpdate_MASTER) return
        if (channelUpdate_NAME && (oldChannel.name != newChannel.name)) {
            logger.info(`Channel Name Changed: From #${oldChannel.name} To #${newChannel.name}`)
            this.Pistachio.reply(`**Channel Name Changed: From #{0} To {1}**`, {
                socket: [oldChannel.name, newChannel],
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
            this.Pistachio.reply(`**Channel Topic Changed: For {0}**\n**From:** {1}\n**To:** {2}`, {
                socket: [newChannel, oldChannel.topic, newChannel.topic],
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
            this.Pistachio.reply(`**Channel NSFW status Changed: For {0}**\n**To:** {1}\n`, {
                socket: [newChannel, newChannel.nsfw ? yes : no],
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
            this.Pistachio.reply(`**Channel Type Changed: For {0}**\n**To:** {1}`, {
                socket: [newChannel, newChannel.type],
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
            this.Pistachio.reply(`**Channel Category Changed: For {0}**\n**From:** {1}\n**To:** {2}`, {
                socket: [newChannel, oldChannel.parentID ? bot.channels.get(oldChannel.parentID) : `No Category`, newChannel.parentID ? bot.channels.get(newChannel.parentID) : `No Category`],
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
        this.Pistachio.reply(`**Channel Created: #{0}**\n*check audit logs to see who did it*`, {
            socket: [channel.name],
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
        this.Pistachio.reply(`**Channel Deleted: #{0}**\n*check audit logs to see who did it*`, {
            socket: [channel.name],
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
        const { emojiUpdate_MASTER, emojiUpdate_NAME } = logSystemConfig
        if (!emojiUpdate_MASTER) return
        if (this.logChannel.guild.id != oldEmoji.guild.id) return
        if (emojiUpdate_NAME && (oldEmoji.name != newEmoji.name)){
            logger.info(`Emoji Name Changed > From: ${oldEmoji.name} To: ${newEmoji.name}`)
            this.Pistachio.reply(`**Emoji Name Changed: From: **{0} **To: **{1}`, {
                socket: [oldEmoji.name, newEmoji.name],
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
        this.Pistachio.reply(`**Emoji Created: **{0}`, {
            socket: [emoji.name],
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
        this.Pistachio.reply(`**Emoji Deleted: **@{0}`, {
            socket: [emoji.name],
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            author: bot.user,
            header: bot.user.username
        })
    }

    roleUpdate() {
        const { bot: { logger }, bot, oldRole, newRole } = this.data
        const { roleUpdate_MASTER } = logSystemConfig
        if (!roleUpdate_MASTER) return
        if (this.logChannel.guild.id != newRole.guild.id) return
        if (oldRole.name != newRole.name){
            logger.info(`Role name changed: ${newRole.name}`)
            this.Pistachio.reply(`**Role Name Changed: {0}**\n**Old Role: **{1}`, {
                socket: [newRole, oldRole.name],
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
        this.Pistachio.reply(`**Role Created: {0}**`, {
            socket: [role],
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
        this.Pistachio.reply(`**Role Deleted: @{0}**`, {
            socket: [role.name],
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${role.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    messageUpdate() {
        const { bot: { logger }, oldMessage, newMessage } = this.data
        const { messageUpdate_MASTER } = logSystemConfig
        if (!messageUpdate_MASTER) return
        if (this.logChannel.guild.id != newMessage.guild.id) return
        if (oldMessage.content != newMessage.content){
            if (oldMessage.content.length > 1950) oldMessage.content = oldMessage.content.substring(0,1950) + `...`
            logger.info(`Message edited in #${newMessage.channel.name}`)
            this.Pistachio.reply(`**{0} Edited their message in: **{1}\n**Old: **{2}`, {
                socket: [newMessage.author, newMessage.channel, oldMessage.content],
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
        const { bot: { logger }, bot, messages } = this.data
        var message = messages.first()
        if (this.logChannel.guild.id != message.guild.id) return
        logger.info(`Bulk Message delete in #${message.channel.name}`)
        this.Pistachio.reply(`**{0} Messages bulk deleted in {1}**`, {
            socket: [messages.size, message.channel],
            footer: `ChannelID: ${message.channel.id}`,
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            author: bot.user,
            header: bot.user.username
        })
    }

    messageDelete() {
        const { bot: { logger }, message } = this.data
        if (message.author.bot) return
        if (this.logChannel.guild.id != message.guild.id) return
        logger.info(`Message deleted in #${message.channel.name} Message Content:\n${message.content ? message.content : `No Text`}`)
        if (message.attachments.size > 0) {
            var index = 1
            message.attachments.forEach(element=>{
                this.Pistachio.reply(`**Message deleted in {0}**\n**Message Content: **\n{1}`, {
                    socket: [message.channel, message.content ? message.content : `No Text`],
                    footer: `ChannelID: ${message.channel.id} Attachment #${index}`,
                    timestamp: true,
                    color: palette.red,
                    field: this.logChannel,
                    image: element.url,
                    header: message.author.username,
                    author: message.author
                })
                index++
            })
        } else {
            this.Pistachio.reply(`**Message deleted in {0} Message Content:**\n{1}`,{
                socket: [message.channel, message.content ? message.content : message.embeds.length > 0 ? `Was an embed`: `No Text`],
                footer: `ChannelID: ${message.channel.id}`,
                timestamp: true,
                color: palette.red,
                field: this.logChannel,
                header: message.author.username,
                author: message.author
            })
        }
    }

    guildBanAdd(){
        const { bot: { logger }, bot, guild, user } = this.data
        if (this.logChannel.guild.id != guild.id) return
        logger.info(`Member Banned From ${guild.id}, ${user}`)
        this.Pistachio.reply(`**Member Banned: **{0} - {1}`, {
            socket: [user, user.username],
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
        this.Pistachio.reply(`**Member Ban revoked: **{0} - {1}`, {
            socket: [user, user.username],
            timestamp: true,
            field: this.logChannel,
            color: palette.red,
            footer: `ID: ${user.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildCreate() {
        const { bot: { logger }, bot, guild } = this.data
        logger.info(`New guild joined ${guild.id}`)
        this.Pistachio.reply(`**New Guild Joined: **{0} - {1}`, {
            socket: [guild.id, guild.name],
            timestamp: true,
            color: palette.green,
            field: this.SupportServerLogChannel,
            footer: `ID: ${guild.id}`,
            author: bot.user,
            header: bot.user.username
        })

        // Post a message in the server joined
        const getDefaultChannel = (guild, channelName) => {

            // Check for a "general" channel, which is often default chat
            const generalChannel = guild.channels.find(channel => channel.name === channelName)
            if (generalChannel) return generalChannel
            return false
        }
        const getChannel = (guild) => {
            let channel = guild.channels
                .filter(c => c.type === `text` && c.permissionsFor(guild.client.user).has(`SEND_MESSAGES`))
                .sort((a, b) => a.position - b.position || Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
                .first()
            if (!channel) return false
            return channel
        }
        let hasSystemChannelID = guild.systemChannelID != null 
        if (hasSystemChannelID) return this.Pistachio.reply(`Hello`, { field: bot.channels.get(guild.systemChannelID) })

        let hasGeneral = getDefaultChannel(guild, `general`)
        if (hasGeneral) return this.Pistachio.reply(`Hello`, {
            field: hasGeneral,
            author: bot.user,
            header: bot.user.username })

        let hasBotChannel = getDefaultChannel(guild, `bot`)
        if (hasBotChannel) return this.Pistachio.reply(`Hello`, {
            field: hasBotChannel,
            author: bot.user,
            header: bot.user.username })

        let hasLogChannel = getDefaultChannel(guild, `logs`)
        if (hasLogChannel) return this.Pistachio.reply(`Hello`, {
            field: hasLogChannel,
            author: bot.user,
            header: bot.user.username })

        let hasChatableChannel = getChannel(guild)
        if (hasChatableChannel) return this.Pistachio.reply(`Hello`, {
            field: hasChatableChannel,
            author: bot.user,
            header: bot.user.username })

        try {
            let owner = guild.owner
            return this.Pistachio.reply(`Hello`, {
                field: owner,
                author: bot.user,
                header: bot.user.username })
        } catch (e) {
            return logger.info(`There was no way To Send a Message to the server`)
        }
    }

    guildDelete() {
        const { bot: { logger }, bot, guild } = this.data
        logger.info(`Guild Left ${guild.id}`)
        this.Pistachio.reply(`**Guild Left: **{0} - {1}`, {
            socket: [guild.id, guild.name],
            timestamp: true,
            color: palette.red,
            field: this.SupportServerLogChannel,
            footer: `ID: ${guild.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    guildUnavailable() {
        const { bot: { logger }, bot, guild } = this.data
        if (this.logChannel.guild.id != guild.id) return
        logger.info(`Guild Unavailable ${guild.id}`)
        this.Pistachio.reply(`**Guild Unavailable: **{0} - {1}`, {
            socket: [guild.id, guild.name],
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
            this.Pistachio.reply(`**Guild Name change: **{0} -> {1}`, {
                socket: [oldGuild.name, newGuild.name],
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
            this.Pistachio.reply(`**Guild region change: **{0} -> {1}`, {
                socket: [oldGuild.region, newGuild.region],
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
        this.Pistachio.reply(`**Member Joined: **{0} - {1}`, {
            socket: [member, member.user.username],
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
        logger.info(`Member Left ${member.guild.id}, ${member}`)
        this.Pistachio.reply(`**Member Left: **{0} - {1}`, {
            socket: [member, member.user.username],
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
            this.Pistachio.reply(`** {0} nickname change: **{1} - {2}`, {
                socket: [newMember, oldMember.nickname, newMember.nickname],
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
        this.Pistachio.reply(`** {0} Members from: **{1} - {2}`, {
            socket: [members.length, guild.id, guild.name],
            timestamp: true,
            field: this.logChannel,
            color: palette.green,
            footer: `ID: ${guild.id}`,
            author: bot.user,
            header: bot.user.username
        })
    }

    record() {
        const { typeOfLog } = this.data
        if (!typeOfLog) return
        if (!logSystemConfig.WANT_CUSTOM_LOGS) return
        if (typeOfLog == `channelUpdate`) return this.channelUpdate()
        if (typeOfLog == `channelCreate`) return this.channelCreate()
        if (typeOfLog == `channelDelete`) return this.channelDelete()
        if (typeOfLog == `emojiUpdate`) return this.emojiUpdate()
        if (typeOfLog == `emojiCreate`) return this.emojiCreate()
        if (typeOfLog == `emojiDelete`) return this.emojiDelete()
        if (typeOfLog == `messageUpdate`) return this.messageUpdate()
        if (typeOfLog == `messageDeleteBulk`) return this.messageDeleteBulk()
        if (typeOfLog == `messageDelete`) return this.messageDelete()
        if (typeOfLog == `roleUpdate`) return this.roleUpdate()
        if (typeOfLog == `roleCreate`) return this.roleCreate()
        if (typeOfLog == `roleDelete`) return this.roleDelete()
        if (typeOfLog == `guildBanAdd`) return this.guildBanAdd()
        if (typeOfLog == `guildBanRemove`) return this.guildBanRemove()
        if (typeOfLog == `guildCreate`) return this.guildCreate()
        if (typeOfLog == `guildDelete`) return this.guildDelete()
        if (typeOfLog == `guildMemberAdd`) return this.guildMemberAdd()
        if (typeOfLog == `guildMemberRemove`) return this.guildMemberRemove()
        if (typeOfLog == `guildMembersChunk`) return this.guildMembersChunk()
        if (typeOfLog == `guildMemberUpdate`) return this.guildMemberUpdate()
        if (typeOfLog == `guildUnavailable`) return this.guildUnavailable()
        if (typeOfLog == `guildUpdate`) return this.guildUpdate()
    }

}


module.exports = LogsSystem