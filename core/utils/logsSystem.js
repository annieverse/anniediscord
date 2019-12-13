`use-strict`
const palette = require(`../utils/colorset.json`)
const { RichEmbed, Attachment } = require(`discord.js`)
const fsn = require(`fs-nextra`)
const logSystemConfig = require(`../utils/config/logsSystemModules.json`)
const { get } = require(`snekfetch`)

/**
 *  Handling log records
 *  @LogsSystem
 */
class LogsSystem {

    constructor(data) {
        this.data = data
        this.logChannel = data.bot.channels.get(`460267216324263936`)
    }

    /** Annie's custom system message.
     *  @param content as the message content
     *  @param {Array} socket is the optional message modifier. Array
     *  @param {ColorResolvable} color for the embed color. Hex code
     *  @param {Object} field as the message field target (GuildChannel/DM). Object
     *  @param {ImageBuffer} image as the attachment url. Buffer
     *  @param {String or Object} header use header in an embed.
     *  @param {Date} timestamp use a date object in embed
     *  @param {Object} author use user object to set author
     */
    reply(content, options = {
        socket: [],
        color: ``,
        url: null,
        image: null,
        field: null,
        header: null,
        footer: null,
        author: null,
        timestamp: false
    }) {
        options.socket = !options.socket ? [] : options.socket
        options.color = !options.color ? palette.red : options.color
        options.url = !options.url ? null : options.url
        options.image = !options.image ? null : options.image
        options.field = !options.field ? options.field = this.logChannel : options.field
        options.author = !options.author ?  options.author = this.data.bot.user : options.author
        options.header = !options.header ? options.header = this.data.bot.user : options.header
        options.footer = !options.footer ? null : options.footer
        options.timestamp == false ? null : options.timestamp = true

        //  Socketing
        for (let i = 0; i < options.socket.length; i++) {
            if (content.indexOf(`{${i}}`) != -1) content = content.replace(`{${i}}`, options.socket[i])
        }

        const embed = new RichEmbed()
            .setColor(options.color)
            .setDescription(content)
        //  Add header
        if (options.header) embed.setAuthor(options.header.username, this.avatar(options.author.id))

        //  Add footer
        if (options.footer) embed.setFooter(options.footer)

        //  Add footer
        if (options.timestamp) embed.setTimestamp()

        // Add url
        if (options.url) embed.setURL(options.url)

        //  Add image preview
        if (options.image) {
            embed.attachFile(new Attachment(options.image, `preview.jpg`))
            embed.setImage(`attachment://preview.jpg`)
        } else if (embed.file) {
            embed.image.url = null
            embed.file = null
        }


        //  If deleteIn parameter was not specified
        return options.field.send(embed)
    }
    //  Load asset from default images dir
    async loadAsset (id){
        return fsn.readFile(`./core/images/${id}.png`).catch(async () => { return fsn.readFile(`./core/images/halloween/${id}.png`) })
    }

    /**
     *	Handles user's avatar fetching process.
     *	Set `true` on second param to return as compressed buffer. (which is needed by canvas)
     *	@param {String|ID} id id of user to be fetched from.
     *	@param {Boolean} compress set true to return as compressed buffer.
     */
    avatar(id, compress = false){

        const { bot } = this.data
        const fallbackImage = (err) => {
            const { bot } = this.data
            bot.logger.error(`Failed to parse user's avatar. User will see a placeholder img as an exchange. > ${err}`)
            return this.loadAsset(`error`)
        }

        try {
            let url = bot.users.get(id).displayAvatarURL
            if (compress) {
                return get(url.replace(/\?size=2048$/g, `?size=512`))
                    .then(data => data.body)
                    .catch(e => { return fallbackImage(e) })
            }

            return url
        }
        catch (e) { return fallbackImage(e) }
    }

    channelUpdate() {
        const { bot: { logger }, oldChannel, newChannel, bot } = this.data
        if (this.logChannel.guild.id != oldChannel.guild.id) return
        const {channelUpdate_MASTER, channelUpdate_NAME, channelUpdate_TOPIC, channelUpdate_NSFW, channelUpdate_TYPE, channelUpdate_CATEGORY } = logSystemConfig
        if (!channelUpdate_MASTER) return
        if (channelUpdate_NAME && (oldChannel.name != newChannel.name)) {
            logger.info(`Channel Name Changed: From #${oldChannel.name} To #${newChannel.name}`)
            this.reply(`**Channel Name Changed: From #{0} To {1}**`, {
                socket: [oldChannel.name, newChannel],
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green
            })
        }
        if (channelUpdate_TOPIC && (oldChannel.topic != newChannel.topic)) {
            logger.info(`Channel Topic Changed: For #${newChannel.name}`)
            if (!oldChannel.topic) oldChannel.topic = `nothing`
            if (!newChannel.topic) newChannel.topic = `nothing`
            this.reply(`**Channel Topic Changed: For {0}**\n**From:** {1}\n**To:** {2}`, {
                socket: [newChannel, oldChannel.topic, newChannel.topic],
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green
            })
        }
        if (channelUpdate_NSFW && (oldChannel.nsfw != newChannel.nsfw)) {
            logger.info(`Channel NSFW status Changed: For #${newChannel.name}`)
            var yes = `Is Now NSFW`
            var no = `Is Not NSFW Anymore`
            this.reply(`**Channel NSFW status Changed: For {0}**\n**To:** {1}\n`, {
                socket: [newChannel, newChannel.nsfw ? yes : no],
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green,
            })
        }
        if (channelUpdate_TYPE && (oldChannel.type != newChannel.type)) {
            logger.info(`Channel Type Changed: For #${newChannel.name}`)
            this.reply(`**Channel Type Changed: For {0}**\n**To:** {1}`, {
                socket: [newChannel, newChannel.type],
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green,
            })
        }
        if (channelUpdate_CATEGORY && (oldChannel.parentID != newChannel.parentID)) {
            logger.info(`Channel Category Changed: For #${newChannel.name}`)
            this.reply(`**Channel Category Changed: For {0}**\n**From:** {1}\n**To:** {2}`, {
                socket: [newChannel, oldChannel.parentID ? bot.channels.get(oldChannel.parentID) : `No Category`, newChannel.parentID ? bot.channels.get(newChannel.parentID) : `No Category`],
                footer: `ID: ${newChannel.id}`,
                timestamp: true,
                color: palette.green,
            })
        }
    }

    channelCreate() {
        const { bot: { logger }, channel } = this.data
        if (!channel || channel.name == `undefined` || channel.name == undefined) return
        if (this.logChannel.guild.id != channel.guild.id) return
        logger.info(`New Channel Created: #${channel.name}`)
        this.reply(`**Channel Created: #{0}**\n*check audit logs to see who did it*`, {
            socket: [channel.name],
            footer: `ID: ${channel.id}`,
            timestamp: true,
            color: palette.green
        })
    }

    channelDelete() {
        const { bot: { logger }, channel } = this.data
        if (this.logChannel.guild.id != channel.guild.id) return
        logger.info(`Channel Deleted > ${channel.name}`)
        this.reply(`**Channel Deleted: #{0}**\n*check audit logs to see who did it*`, {
            socket: [channel.name],
            footer: `ID: ${channel.id}`,
            timestamp: true,
            color: palette.red
        })
    }

    emojiUpdate() {
        const { bot: { logger }, oldEmoji, newEmoji } = this.data
        const { emojiUpdate_MASTER, emojiUpdate_NAME } = logSystemConfig
        if (!emojiUpdate_MASTER) return
        if (this.logChannel.guild.id != oldEmoji.guild.id) return
        if (emojiUpdate_NAME && (oldEmoji.name != newEmoji.name)){
            logger.info(`Emoji Name Changed > From: ${oldEmoji.name} To: ${newEmoji.name}`)
            this.reply(`**Emoji Name Changed: From: **{0} **To: **{1}`, {
                socket: [oldEmoji.name, newEmoji.name],
                timestamp: true,
                color: palette.red
            })
        }
    }

    emojiCreate() {
        const { bot: { logger }, emoji } = this.data
        if (this.logChannel.guild.id != emoji.guild.id) return
        logger.info(`Emoji Created: ${emoji.name}`)
        this.reply(`**Emoji Created: **{0}`, {
            socket: [emoji.name],
            timestamp: true,
            color: palette.red
        })
    }

    emojiDelete() {
        const { bot: { logger }, emoji } = this.data
        if (this.logChannel.guild.id != emoji.guild.id) return
        logger.info(`Emoji Deleted: ${emoji.name}`)
        this.reply(`**Emoji Deleted: **@{0}`, {
            socket: [emoji.name],
            timestamp: true,
            color: palette.red
        })
    }

    roleUpdate() {
        const { bot: { logger }, oldRole, newRole } = this.data
        const { roleUpdate_MASTER } = logSystemConfig
        if (!roleUpdate_MASTER) return
        if (this.logChannel.guild.id != newRole.guild.id) return
        if (oldRole.name != newRole.name){
            logger.info(`Role name changed: ${newRole.name}`)
            this.reply(`**Role Name Changed: {0}**\n**Old Role: **{1}`, {
                socket: [newRole, oldRole.name],
                timestamp: true,
                color: palette.red,
                footer: `ID: ${newRole.id}`
            })
        }
    }

    roleCreate() {
        const { bot: { logger }, role } = this.data
        if (this.logChannel.guild.id != role.guild.id) return
        logger.info(`Role Created: ${role.name}`)
        this.reply(`**Role Created: {0}**`, {
            socket: [role],
            timestamp: true,
            color: palette.red,
            footer: `ID: ${role.id}`
        })
    }

    roleDelete() {
        const { bot: { logger }, role } = this.data
        if (this.logChannel.guild.id != role.guild.id) return
        logger.info(`Role Deleted: ${role.name}`)
        this.reply(`**Role Deleted: @{0}**`, {
            socket: [role.name],
            timestamp: true,
            color: palette.red,
            footer: `ID: ${role.id}`
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
            this.reply(`**{0} Edited their message in: **{1}\n**Old: **{2}`, {
                socket: [newMessage.author, newMessage.channel, oldMessage.content],
                footer: `ChannelID: ${newMessage.channel.id}`,
                timestamp: true,
                color: palette.red,
                header: newMessage.author,
                author: newMessage.author
            })
        }
    }

    messageDeleteBulk() {
        const { bot: { logger }, messages } = this.data
        var message = messages.first()
        if (this.logChannel.guild.id != message.guild.id) return
        logger.info(`Bulk Message delete in #${message.channel.name}`)
        this.reply(`**{0} Messages bulk deleted in {1}**`, {
            socket: [messages.size, message.channel],
            footer: `ChannelID: ${message.channel.id}`,
            timestamp: true,
            color: palette.red
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
                this.reply(`**Message deleted in {0}**\n**Message Content: **\n{1}`, {
                    socket: [message.channel, message.content ? message.content : `No Text`],
                    footer: `ChannelID: ${message.channel.id} Attachment #${index}`,
                    timestamp: true,
                    color: palette.red,
                    image: element.url,
                    header: message.author,
                    author: message.author
                })
                index++
            })
        } else {
            this.reply(`**Message deleted in {0} Message Content:**\n{1}`,{
                socket: [message.channel, message.content ? message.content : message.embeds.length > 0 ? `Was an embed`: `No Text`],
                footer: `ChannelID: ${message.channel.id}`,
                timestamp: true,
                color: palette.red,
                header: message.author,
                author: message.author
            })
        }
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
        if (typeOfLog == `guildBanAdd`) return
        if (typeOfLog == `guildBanRemove`) return
        if (typeOfLog == `guildCreate`) return
        if (typeOfLog == `guildDelete`) return
        if (typeOfLog == `guildMemberAdd`) return
        if (typeOfLog == `guildMemberRemove`) return
        if (typeOfLog == `guildMembersChunk`) return
        if (typeOfLog == `guildMemberUpdate`) return
        if (typeOfLog == `guildUnavailable`) return
        if (typeOfLog == `guildUpdated`) return
    }

}


module.exports = LogsSystem