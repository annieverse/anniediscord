const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Enable or disable level-up message module for this guild
 * @author klerikdust
 */
class SetLevelupMessage extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * An array of the available options for welcomer module
         * @type {array}
         */
        this.actions = [`enable`, `disable`]

        /**
         * Current instance's config code
         * @type {string}
         */  
        this.primaryConfigID = `LEVEL_UP_MESSAGE`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETLEVELUPMESSAGE.GUIDE, {
            header: `Hi, ${name(this.user.id)}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieGeek`)
            }
        })
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return reply(this.locale.SETLEVELUPMESSAGE.INVALID_ACTION, {
            socket: {actions: this.actions.join(`, `)},
        })   
        //  Run action
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](...arguments)
    }

    /**
     * Enabling levelup-message module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    async enable({ reply, name }) {
        const fn = `[setLevelupMessage.enable()]`
        //  Handle if module already enabled before the action.
        if (this.primaryConfig.value) {
            const now = moment()
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETLEVELUPMESSAGE.ALREADY_ENABLED, {
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
        return reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_ENABLED, {
            socket: {prefix: this.bot.prefix},
            status: `success`
        })
    }

    /**
     * Disabling levelup-message module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    async disable({ reply, emoji }) {
        const fn = `[setLevelupMessage.disable()]`
        //  Handle if module already disabled before the action.
        if (!this.primaryConfig.value) return reply(this.locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {
            socket:{prefix:this.bot.prefix}
        })
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.message.guild.id} has been disabled.`)
        return reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_DISABLED, {status: `success`})
    }
}

module.exports.help = {
    start: SetLevelupMessage,
    name: `setLevelupMessage`,
    aliases: [`setlevelupmsg`, `setlvlupmsg`, `setlvlupmessage`, `setlevelupmessage`],
    description: `Enable or disable level-up message module for this guild`,
    usage: `setlvlupmsg <Enable/Disable>`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}

