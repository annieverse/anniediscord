`use-strict`
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
         * Current guild's instance
         * @type {object}
         */
        this.guild = data.guild

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
         * The default locale for current command instance
         * @type {object}
         */	
		this.locale = data.bot.locale[`en`]	
        /**
         * Current guild's configurations factory
         * @type {map}
         */
        this.configs = this.guild ? this.guild.configs : null
        //  Handle if typeOfLog is not provided
        if (!data.typeOfLog) return
        //  Run GUILD_CREATE and GUILD_DELETE in support's server
        if ([`GUILD_CREATE`, `GUILD_DELETE`].includes(data.typeOfLog)) return this[this._configCodeToMethod(data.typeOfLog)](new Pistachio({bot: data.bot}))
        if (!this.configs) return
        //  Handle if logs_module isn't enabled in the current guild instance
        if (!this.configs.get(`LOGS_MODULE`).value) return
        //  Handle if logs channel cannot be found
        this.findLogsChannel()
        if (!this.logsChannel) return
        //  Run log based on given type
        this[this._configCodeToMethod(data.typeOfLog)](new Pistachio({bot: data.bot}))
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
        if (channel.has(this.configs.get(`LOGS_CHANNEL`).value)) return this.logsChannel = customLogChannel
        //  Find a log channel by system assumption
        const assumptionLogChannel = channel.find(node => (node.name.toLowerCase() === `logs`) || (node.name.toLowerCase() === `log`))
        if (assumptionLogChannel !== undefined) return this.logsChannel = assumptionLogChannel
        //  Fallback
        this.logger.info(`${fn} fail to find the target log channel for GUILD_ID:${this.guildId}`)
        this.logsChannel = null
        return 
    }

    /**
     * CHANNEL_UPDATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    channelUpdate({ reply, emoji }) {
        const fn = `[Logs.channelUpdate()]`
        //  Handle if channel update wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.oldChannel.guild.id) return
        //  Handle if no channel's name changes are made
        if (this.data.oldChannel.name === this.data.newChannel.name) return
        //  Send logs
        this.logger.info(`${fn} A channel's name was updated in GUILD_ID:${this.data.newChannel.guild.id}`)
        reply(this.locale.LOGS.CHANNEL_UPDATE, {
            header: `#${this.data.newChannel.name} channel name just got refreshed.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                oldChannel: this.data.oldChannel.name,
                newChannel: this.data.newChannel,
                emoji: emoji(`AnnieSmile`)
            }
        })
        
    }

    /**
     * CHANNEL_CREATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    channelCreate({ reply, emoji }) {
        const fn = `[Logs.channelCreate()]`
        //  Handle if channel cannot be found/has invalid metadata
        if (!this.data.channel || typeof this.data.channel.name === undefined) return
        //  Handle if channel delete wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.channel.guild.id) return
        //  Send logs
        this.logger.info(`${fn} A new channel was created in GUILD_ID:${this.data.channel.guild.id}`)
        return reply(this.locale.LOGS.CHANNEL_CREATE, {
            header: `${this.data.channel.name} channel was created!`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                channel: this.data.channel,
                emoji: emoji(`AnnieDab`)
            }
        })
    }

    /**
     * CHANNEL_DELETE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    channelDelete({ reply, emoji }) {
        const fn = `[Logs.channelDelete()]`
        //  Handle if channel delete wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.channel.guild.id) return
        //  Send logs
        this.logger.info(`${fn} A channel was deleted in GUILD_ID:${this.data.channel.guild.id}`)
        return reply(this.locale.LOGS.CHANNEL_DELETE, {
            header: `${this.data.channel.name} channel was deleted.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                channel: this.data.channel.name,
                emoji: emoji(`AnnieThinking`)
            }
        })
    }

    /**
     * EMOJI_UPDATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    emojiUpdate({ reply }) {
        const fn = `[Logs.emojiUpdate()]`
        //  Handle if emoji update wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.newEmoji.guild.id) return
        //  Handle if the emoji doesn't actually change
        if (this.data.oldEmoji.name === this.data.newEmoji.name) return
        //  Send logs
        this.logger.info(`${fn} An emoji was updated in GUILD_ID:${this.data.newEmoji.guild.id}`)
        return reply(this.locale.LOGS.EMOJI_UPDATE, {
            header: `${this.data.newEmoji.name} emoji just got refreshed!`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                newEmoji: this.data.newEmoji.name,
                oldEmoji: this.data.oldEmoji.name
            }
        })
    }

    /**
     * EMOJI_CREATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    emojiCreate({ reply, emoji }) {
        const fn = `[Logs.emojiCreate()]`
        //  Handle if emoji delete wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.emoji.guild.id) return
        //  Send logs
        this.logger.info(`${fn} An emoji was created in GUILD_ID:${this.data.emoji.guild.id}`)
        return reply(this.locale.LOGS.EMOJI_CREATE, {
            header: `${this.data.emoji.name} emoji was created!`,
            timestamp: true,
            field: this.logsChannel,
            socket: {emoji: emoji(this.data.emoji.name)}
        })
    }

    /**
     * EMOJI_DELETE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    emojiDelete({ reply }) {
        const fn = `[Logs.emojiDelete()]`
        //  Handle if emoji delete wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.emoji.guild.id) return
        //  Send logs
        this.logger.info(`${fn} An emoji was deleted in GUILD_ID:${this.data.emoji.guild.id}`)
        return reply(this.locale.LOGS.EMOJI_DELETE, {
            header: `${this.data.emoji.name} emoji was deleted.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {emoji: this.data.emoji.name}
        })
    }

    /**
     * ROLE_UPDATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    roleUpdate({ reply }) {
        const fn = `[Logs.roleUpdate()]`
        //  Handle if role change wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.newRole.guild.id) return
        //  Handle if role isn't changed
        if (this.data.oldRole.name === this.data.newRole.name) return
        //  Send logs
        this.logger.info(`${fn} A role was updated in GUILD_ID:${this.data.newRole.guild.id}`)
        return reply(this.locale.LOGS.ROLE_UPDATE, {
            header: `A refreshed role, ${this.data.newRole.name}.`,
            timestamp: true,
            color: this.data.newRole.hexColor,
            field: this.logsChannel,
            socket: {
                oldRole: `${this.data.oldRole.name}(${this.data.oldRole.id})`,
                newRole: this.data.newRole,
                color: this.data.newRole.hexColor.toUpperCase()
            }
        })
    }

    /**
     * ROLE_CREATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    roleCreate({ reply, emoji }) {
        const fn = `[Logs.roleCreate()]`
        //  Handle if role change wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.role.guild.id) return
        //  Send logs
        this.logger.info(`${fn} A role was created in GUILD_ID:${this.data.role.guild.id}`)
        return reply(this.locale.LOGS.ROLE_CREATE, {
            header: `A role was created.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {emoji: emoji(`AnnieHype`)}
        })
    }

    /**
     * ROLE_DELETE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    roleDelete({ reply, emoji }) {
        const fn = `[Logs.roledelete()]`
        //  Handle if role change wasn't from the same guild id
        if (this.logsChannel.guild.id !== this.data.role.guild.id) return
        //  Send logs
        this.logger.info(`${fn} A role was deleted in GUILD_ID:${this.data.role.guild.id}`)
        return reply(this.locale.LOGS.ROLE_DELETE, {
            header: `${this.data.role.name} role was deleted.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                role: `${this.data.role.name}(${this.data.role.id})`,
                emoji: emoji(`AnniePogg`)
            }
        })
    }

    /**
     * MESSAGE_UPDATE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    messageUpdate({ reply, emoji }) {
        const fn = `[Logs.messageUpdate()]`
        //  Handle if message is coming from direct message interface
        if (this.data.newMessage.channel.type ==`dm`) return
        //  Handle if the updated message's guild ID isn't the same log's channel guild's ID 
        if (this.logsChannel.guild.id !== this.data.newMessage.guild.id) return
        //  Handle if old's content is the same as new's message content
        if (this.data.oldMessage.content === this.data.newMessage.content) return
        this.logger.info(`${fn} a message was edited in GUILD_ID:${this.guild.id}`)
        if (this.data.oldMessage.content.length > 1950) this.data.oldMessage.content = this.data.oldMessage.content.substring(0,1950) + `...`
        //  Send logs
        return reply(this.locale.LOGS.MESSAGE_UPDATE, {
            header: `A message was edited by ${this.data.newMessage.author.username}.`,
            thumbnail: this.data.newMessage.author.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                channel: this.data.newMessage.channel,
                oldMessage: this.data.oldMessage.content,
                newMessage: this.data.newMessage.content,
                user: this.data.newMessage.author,
                emoji: emoji(`AnnieSmile`)
            }
        })
    }

    /**
     * MESSAGE_DELETE_BULK event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    messageDeleteBulk({ reply }) {
        const fn = `[Logs.messageDeleteBulk()]`
        const message = this.data.messages.first()
        //  Handle if message is coming from direct message interface
        if (message.channel.type ==`dm`) return
        //  Preventation, incase the current guild instance isn't in the same place as received message id.
        if (this.logsChannel.guild.id !== message.guild.id) return
        this.logger.info(`${fn} a bulk of message was deleted from GUILD_ID:${this.guild.id}`)
        return reply(this.locale.LOGS.MESSAGE_DELETE_BULK, {
            header: `Bulk of Messages deletion was performed.`,
            timestamp: true,
            field: this.logsChannel,
            socket: {
                messages: (this.data.messages.size-1),
                channel: message.channel
            }
        })
    }

    /**
     * MESSAGE_DELETE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    messageDelete({ reply }) {
        const fn = `[Logs.messageDelete()]`
        //  Handle if message is coming from bot-typed user
        if (this.message.author.bot) return
        //  Handle if message is coming from direct message interface
        if (this.message.channel.type ==`dm`) return
        //  Preventation, incase the current guild instance isn't in the same place as received message id.
        if (this.logsChannel.guild.id != this.message.guild.id) return
        this.logger.info(`${fn} a message was deleted from GUILD_ID:${this.guild.id}`)
        return reply(this.locale.LOGS.MESSAGE_DELETE, {
            header: `A message was deleted by ${this.message.author.username}.`,
            thumbnail: this.message.author.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                channel: this.message.channel,
                content: this.message.content || `???`,
                user: this.message.author
            }
        })
    }

    /**
     * GUILD_BAN_ADD event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    guildBanAdd({ reply, emoji }){
        const fn = `[Logs.guildBanAdd()]`
        //  Handle if received guild isn't same as the log's channel guild id
        if (this.logsChannel.guild.id !== this.data.guild.id) return
        //  Send logs
        this.logger.info(`${fn} a member was banned from GUILD_ID:${this.data.guild.id}`)
        return reply(this.locale.LOGS.GUILD_BAN_ADD, {
            header: `${this.data.user.username} just got banned.`,
            thumbnail: this.data.user.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                emoji: emoji(`AnnieYandere`),
                user: this.data.user
            }
        })
    }

    /**
     * GUILD_BAN_REMOVE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    guildBanRemove({ reply, emoji }) {
        const fn = `[Logs.guildBanRemove()]`
        //  Handle if received guild isn't same as the log's channel guild id
        if (this.logsChannel.guild.id !== this.data.guild.id) return
        //  Send logs
        this.logger.info(`${fn} a user's ban status has been revoked from GUILD_ID:${this.data.guild.id}`)
        return reply(this.locale.LOGS.GUILD_BAN_REMOVE, {
            header: `${this.data.user.username} got their ban revoked!`,
            thumbnail: this.data.user.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                emoji: emoji(`AnnieSmile`),
                user: this.data.user
            }
        })
    }

    /**
     * GUILD_UPDATE event log
     * @returns {void}
     */
    guildUpdate({ emoji, reply }) {
        const fn = `[Logs.guildUpdate()]`
        //  Handle if received guild isn't same as the log's channel guild id
        if (this.logsChannel.guild.id !== this.data.newGuild.id) return
        //  Send logs if guild has changed their's server name
        if (this.data.oldGuild.name !== this.data.newGuild.name) {
            this.logger.info(`${fn} GUILD_ID:${this.data.newGuild.id} has changed their server name.`)
            reply(this.locale.LOGS.GUILD_UPDATE_NAME, {
                header: `A brand new house, ${this.data.user.username}.`,
                thumbnail: this.data.newGuild.iconURL(),
                timestamp: true,
                field: this.logsChannel,
                socket: {
                    emoji: emoji(`AnnieSmile`),
                    oldGuild: this.data.oldGuild.name,
                    newGuild: this.data.newGuild.name
                }
            })
        }
        //  Send logs if guild has changed their's server region
        if (this.data.oldGuild.region != this.data.newGuild.region) {
            this.logger.info(`${fn} GUILD_ID:${this.data.newGuild.id} has changed their server's region.`)
            reply(this.locale.LOGS.GUILD_UPDATE_REGION, {
                header: `We are switching region!`,
                thumbnail: this.data.newGuild.iconURL(),
                timestamp: true,
                field: this.logsChannel,
                socket: {
                    emoji: emoji(`AnnieThinking`),
                    oldGuild: this.data.oldGuild.region,
                    newGuild: this.data.newGuild.region
                }
            })
        }
    }

    /**
     * GUILD_MEMBER_ADD event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    guildMemberAdd({ reply, emoji }) {
        const fn = `[Logs.guildMemberAdd()]`
        //  Handle if joined member's guild id wasn't in the same place as logs channel's guild id 
        if (this.logsChannel.guild.id !== this.data.member.guild.id) return
        //  Send logs
        this.logger.info(`${fn} a new user has joined GUILD_ID:${this.data.guild.id}`)
        return reply(this.locale.LOGS.GUILD_MEMBER_ADD, {
            header: `Say hi, to ${this.data.member.user.username}!`,
            thumbnail: this.data.member.user.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                emoji: emoji(`AnnieWave`),
                user: this.data.member
            }
        })
    }

    /**
     * GUILD_MEMBER_REMOVE event log
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    guildMemberRemove({ reply, emoji }) {
        const fn = `[Logs.guildMemberRemove()]`
        //  Handle if joined member's guild id wasn't in the same place as logs channel's guild id 
        if (this.logsChannel.guild.id !== this.data.member.guild.id) return
        //  Handle if member isn't bannable
        if (!this.data.member.bannable) return
        //  Send logs
        this.logger.info(`${fn} a user has left GUILD_ID:${this.data.guild.id}`)
        return reply(this.locale.LOGS.GUILD_MEMBER_REMOVE, {
            header: `Farewell .. ${this.data.member.user.username}.`,
            thumbnail: this.data.member.user.displayAvatarURL(),
            timestamp: true,
            field: this.logsChannel,
            socket: {
                emoji: emoji(`AnnieCry`),
                user: this.data.member
            }
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
}


module.exports = LogsSystem
