const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Customize Logging-System for your guild
 * @author klerikdust
 */
class SetLogs extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * List of available actions for the current command
         * @type {array}
         */
        this.actions = [`enable`, `disable`, `channel`]
        /**
         * Thumbnail's img source
         * @type {string}
         */
        this.thumbnail = `https://i.ibb.co/Kwdw0Pc/config.png`
        /**
         * Current instance's config code
         * @type {string}
         */  
        this.primaryConfigID = `LOGS_MODULE`
        /**
         * Current instance's sub-config code
         * @type {string}
         */  
        this.subConfigID = `LOGS_CHANNEL`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) {
            return reply(this.locale.SETLOGS.GUIDE, {
                header: `Hi, ${name(this.user.id)}!`,
                color: `crimson`,
                thumbnail: this.thumbnail,
                socket: {
                    prefix: this.bot.prefix,
                    emoji: emoji(`AnnieSmile`)
                }
            })
        }
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return reply(this.locale.SETLOGS.INVALID_ACTION, {
            socket: {actions: this.actions.join(`, `)},
            status: `fail`
        })
        //  This is the main configuration of setlogs, so everything dependant on this value
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        this.subConfig = this.guildConfigurations.get(this.subConfigID)
        return this[this.args[0]](...arguments)
    }

    /**
     * Enable Action
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async enable({ reply, name }) {
        const fn = `[setLogs.enable()]`
        //  Handle if module is already enabled
        if (this.primaryConfig.value) {
            let localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETLOGS.ALREADY_ENABLED, {
            status: `warn`,
                socket: {
                    user: name(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.message.guild.id} has been enabled.`)
        reply(this.locale.SETLOGS.SUCCESSFULLY_ENABLED, {status: `success`})
    }

    /**
     * Disable Action
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async disable({ reply, name }) {
        const fn = `[setLogs.disable()]`
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) {
            let localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETLOGS.ALREADY_DISABLED, {
            status: `warn`,
                socket: {
                    user: name(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.message.guild.id} has been disabled.`)
        reply(this.locale.SETLOGS.SUCCESSFULLY_DISABLED, {status: `success`})
    }

    /**
     * Define target logs channel
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async channel({ reply, name }) {
        const fn = `[setLogs.channel()]`
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) return reply(this.locale.SETLOGS.SHOULD_BE_ENABLED, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        //  Handle if user hasn't specified the target channel
        if (!this.args[1]) return reply(this.locale.SETLOGS.MISSING_CHANNEL, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        //  Do channel searching by three possible conditions
        const searchChannel = this.message.mentions.channels.first()
        || this.message.guild.channels.cache.get(this.args[1])
        || this.message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return reply(this.locale.SETLOGS.INVALID_CHANNEL, {status: `fail`})
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: searchChannel.id,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.subConfigID} for GUILD_ID:${this.message.guild.id} has been updated.`)
        reply(this.locale.SETLOGS.SUCCESSFULLY_UPDATING_CHANNEL, {
            socket: {channel: searchChannel},
            status: `success`
        })
    }
}

module.exports.help = {
    start: SetLogs,
    name: `setLogs`, 
    aliases: [`setlogs`, `setlog`, `setlogging`], 
    description: `Customize Logging-System for your guild`,
    usage: `setlog`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}