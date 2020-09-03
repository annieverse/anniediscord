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
         * Parameter strucure to be supplied into guild configuration register.
         * @type {object}
         */
        this.configurationMetadata = {
            guild: this.message.guild,
            set_by_user_id: this.message.author.id        
        }

        /**
         * Thumbnail's img source
         * @type {string}
         */
         this.thumbnail = `https://i.ibb.co/Kwdw0Pc/config.png`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETLEVELUPMESSAGE.GUIDE, {
            color: `crimson`,
            thumbnail: this.thumbnail,
            header: `Hi, ${name(this.user.id)}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieGeek`)
            }
        })
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return reply(this.locale.SETLEVELUPMESSAGE.INVALID_ACTION, {
            color: `red`,
            socket: {emoji: emoji(`fail`)}
        })   
        //  Run action
        this.tool = { reply, name, emoji }
        this.config = await this.bot.db.getGuildConfigurations(this.message.guild.id)
        return this[this.args[0].toLowerCase()]()
    }

    /**
     * Enabling levelup-message module
     * @returns {string}
     */
    async enable() {
        const fn = `[setLevelupMessage.enable()]`
        //  Only check if guild already has configs registered
        if (this.config.length > 0) {
            const config = this.config.filter(element => (element.config_code === `level_up_message`) && (parseInt(element.customized_parameter) === 1))[0]
            //  Handle if module already enabled before the action.
            if (config) {
                const now = moment()
                const localizeTime = await this.bot.db.toLocaltime(config.updated_at)
                return this.tool.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_ENABLED, {
                    socket: {
                        user: this.tool.name(config.set_by_user_id),
                        date: moment(localizeTime).fromNow()
                    }
                })
            }
        }
        this.configurationMetadata.config_code = `level_up_message`
        this.configurationMetadata.customized_parameter = 1
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} level_up_message for GUILD_ID ${this.message.guild.id} has been enabled.`)
        return this.tool.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_ENABLED, {
            color: `lightgreen`,
            socket: {
                prefix: this.bot.prefix,
                emoji: this.tool.emoji(`success`)
            }
        })
    }

    /**
     * Disabling levelup-message module
     * @returns {string}
     */
    disable() {
        const fn = `[setLevelupMessage.disable()]`
        //  Only check if guild already has configs registered
        if (this.config.length > 0) {
            const config = this.config.filter(element => (element.config_code === `level_up_message`) && (parseInt(element.customized_parameter) === 0))[0]
            //  Handle if welcomer already disabled before the action.
            if (config) return this.tool.reply(this.locale.SETLEVELUPMESSAGE.ALREADY_DISABLED, {color: `golden`, socket: {emoji: this.tool.emoji(`warn`)} })
        }
        this.configurationMetadata.config_code = `level_up_message`
        this.configurationMetadata.customized_parameter = 0
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} level_up_message for GUILD_ID ${this.message.guild.id} has been disabled.`)
        return this.tool.reply(this.locale.SETLEVELUPMESSAGE.SUCCESSFULLY_DISABLED, {
            color: `lightgreen`,
            socket: {emoji: this.tool.emoji(`success`)}
        })
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

