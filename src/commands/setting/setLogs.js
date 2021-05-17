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
     * @return {void}
     */
    async execute() {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return this.reply(this.locale.SETLOGS.GUIDE, {
            header: `Hi, ${this.user.master.username}!`,
            image: `banner_setlogs`,
            socket: {
                prefix: this.bot.prefix,
                emoji: await this.bot.getEmoji(`692428927620087850`)
            }
        })
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return this.reply(this.locale.SETLOGS.INVALID_ACTION, {
            socket: {actions: this.actions.join(`, `)},
        })
        //  This is the main configuration of setlogs, so everything dependant on this value
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        this.subConfig = this.guildConfigurations.get(this.subConfigID)
        return this[this.args[0]]()
    }

    /**
     * Enable Action
     * @return {void}
     */
    async enable() {
        const fn = `[setLogs.enable()]`
        //  Handle if module is already enabled
        if (this.primaryConfig.value) {
            let localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return this.reply(this.locale.SETLOGS.ALREADY_ENABLED, {
            status: `warn`,
                socket: {
                    user: await this.bot.getUsername(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.reply(this.locale.SETLOGS.SUCCESSFULLY_ENABLED, {status: `success`})
    }

    /**
     * Disable Action
     * @return {void}
     */
    async disable() {
        const fn = `[setLogs.disable()]`
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) {
            return this.reply(this.locale.SETLOGS.ALREADY_DISABLED, {
                socket: {prefix:this.bot.prefix}
            })
        }
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.reply(this.locale.SETLOGS.SUCCESSFULLY_DISABLED, {status: `success`})
    }

    /**
     * Define target logs channel
     * @return {void}
     */
    async channel() {
        //  Handle if module is already enabled
        if (!this.primaryConfig.value) return this.reply(this.locale.SETLOGS.SHOULD_BE_ENABLED, {
            socket: {prefix: this.bot.prefix}
        })
        //  Handle if user hasn't specified the target channel
        if (!this.args[1]) return this.reply(this.locale.SETLOGS.MISSING_CHANNEL, {
            socket: {prefix: this.bot.prefix, emoji: await this.bot.getEmoji(`692428927620087850`)}
        })
        //  Do channel searching by three possible conditions
        const searchChannel = this.message.mentions.channels.first()
        || this.message.guild.channels.cache.get(this.args[1])
        || this.message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return this.reply(this.locale.SETLOGS.INVALID_CHANNEL, {
            socket: {emoji: await this.bot.getEmoji(`692428969667985458`)}
        })
        //  Update configs
        this.bot.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: searchChannel.id,
            guild: this.message.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.reply(this.locale.SETLOGS.SUCCESSFULLY_UPDATING_CHANNEL, {
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
    permissionLevel: 3
}
