const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
const { MessageAttachment } = require(`discord.js`)
/**
 * Manage welcomer module for your guild.
 * @author klerikdust
 */
class SetWelcomer extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * An array of the available options for welcomer module
         * @type {array}
         */
        this.actions = [`enable`, `disable`, `channel`, `text`, `preview`]

        /**
         * Reference key to welcomer sub-modules config code.
         * @type {object}
         */
        this.actionReference = {
            "enable": `welcome_module`,
            "disable": `welcome_module`,
            "channel": `welcome_channel`,
            "text": `welcome_text`
        }

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
        if (!this.fullArgs) return reply(this.locale.SETWELCOMER.GUIDE, {
            color: `crimson`,
            thumbnail: this.thumbnail,
            header: `Hi, ${name(this.user.id)}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieGeek`)
            }
        })
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return reply(this.locale.SETWELCOMER.INVALID_ACTION, {color: `red`})   
        //  Run action
        this.tool = { reply, name, emoji }
        this.config = await this.bot.db.getGuildConfigurations(this.message.guild.id)
        this.actionParameter = this.fullArgs.slice(this.args[0].length+1)
        return this[this.args[0].toLowerCase()]()
    }

    /**
     * Enabling welcomer module
     * @returns {string}
     */
    async enable() {
        const fn = `[setWelcomer.enable()]`
        const config = this.config.filter(element => (element.config_code === `welcome_module`) && (parseInt(element.customized_parameter) === 1))[0]
        //  Handle if welcomer already enabled before the action.
        if (config) {
            const now = moment()
            const localizeTime = await this.bot.db.toLocaltime(config.updated_at)
            return this.tool.reply(this.locale.SETWELCOMER.ALREADY_ENABLED, {
                socket: {
                    user: this.tool.name(config.set_by_user_id),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        this.configurationMetadata.config_code = `welcome_module`
        this.configurationMetadata.customized_parameter = 1
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} welcome_module for GUILD_ID ${this.message.guild.id} has been enabled.`)
        return this.tool.reply(this.locale.SETWELCOMER.SUCCESSFULLY_ENABLED, {
            color: `lightgreen`,
            socket: {
                prefix: this.bot.prefix,
                emoji: this.tool.emoji(`success`)
            }
        })
    }

    /**
     * Disabling welcomer module
     * @returns {string}
     */
    disable() {
        const fn = `[setWelcomer.disable()]`
        const config = this.config.filter(element => (element.config_code === `welcome_module`) && (parseInt(element.customized_parameter) === 0))[0]
        //  Handle if welcomer already disabled before the action.
        if (config) return this.tool.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {color: `golden`, socket: {emoji: this.tool.emoji(`warn`)} })
        this.configurationMetadata.config_code = `welcome_module`
        this.configurationMetadata.customized_parameter = 0
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} welcome_module for GUILD_ID ${this.message.guild.id} has been disabled.`)
        return this.tool.reply(this.locale.SETWELCOMER.SUCCESSFULLY_DISABLED, {
            color: `lightgreen`,
            socket: {emoji: this.tool.emoji(`success`)}
        })
    }

    /**
     * Set new target channel for welcomer module
     * @returns {string}
     */
    channel() {
        const fn = `[setWelcomer.channel()]`
        //  Handle if the user hasn't enabled the module yet
        const primaryModule = this.config.filter(element => (element.config_code === `welcome_module`) && (parseInt(element.customized_parameter) === 1))[0]
        if (!primaryModule) return this.tool.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {color: `golden`, socket: {emoji: this.tools.emoji(`warn`)} }) 
        //  Handle if search keyword isn't provided
        if (!this.actionParameter) return this.tool.reply(this.locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {color: `golden`, socket:{emoji: this.tool.emoji(`warn`)} })
        //  Do channel searching by three possible conditions
        const searchChannel = this.message.mentions.channels.first()
        || this.message.guild.channels.cache.get(this.actionParameter)
        || this.message.guild.channels.cache.find(channel => channel.name === this.actionParameter.toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return this.tool.reply(this.locale.SETWELCOMER.INVALID_CHANNEL, {color: `red`, socket:{emoji: this.tool.emoji(`fail`)} })
        this.configurationMetadata.config_code = `welcome_channel`
        this.configurationMetadata.customized_parameter = searchChannel.id
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} welcome_channel for GUILD_ID ${this.message.guild.id} has been updated.`)
        return this.tool.reply(this.locale.SETWELCOMER.CHANNEL_SUCCESSFULLY_REGISTERED, {
            color: `lightgreen`,
            socket: {
                channel: `<#${searchChannel.id}>`,
                emoji: this.tool.emoji(`success`)
            }
        })
    }

    /**
     * Set message to be attached in the welcomer.
     * @returns {string}
     */
    async text() {
        const fn = `[setWelcomer.text()]`
        //  Handle if the user hasn't enabled the module yet
        const primaryModule = this.config.filter(element => (element.config_code === `welcome_module`) && (parseInt(element.customized_parameter) === 1))[0]
        if (!primaryModule) return this.tool.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {color: `red`}) 
        //  Handle if text content isn't provided
        if (!this.actionParameter) return this.tool.reply(this.locale.SETWELCOMER.EMPTY_TEXT_PARAMETER, {
            socket: {emoji: this.tool.emoji(`warn`), prefix: this.bot.prefix},
            color: `golden`
        })
        this.configurationMetadata.config_code = `welcome_text`
        this.configurationMetadata.customized_parameter = this.actionParameter
        this.bot.db.setCustomConfig(this.configurationMetadata)
        this.logger.info(`${fn} welcome_text for GUILD_ID ${this.message.guild.id} has been updated.`)
        await this.tool.reply(this.locale.SETWELCOMER.TEXT_SUCCESSFULLY_REGISTERED, {socket: {emoji: this.tool.emoji(`success`)}, color: `lightgreen`})
        await this.tool.reply(this.locale.SETWELCOMER.TIPS_TO_PREVIEW, {simplified: true, socket: {emoji: this.tool.emoji(`AnnieSmile`)}, color: `lightgreen`})
        .then(async msg => {
            await msg.react(`✅`)
            const confirmationButtonFilter = (reaction, user) => reaction.emoji.name === `✅` && user.id === this.message.author.id
            const confirmationButton = msg.createReactionCollector(confirmationButtonFilter, { time: 60000 })
            confirmationButton.on(`collect`, () => {
                confirmationButton.stop()
                return this.preview()
            })
        })
    }

    /**
     * Preview this guild's welcomer message
     * @returns {reply}
     */
    async preview() {
        const fn = `[setWelcomer.preview()]`
        //  Handle if the user hasn't enabled the module yet
        const primaryModule = this.config.filter(element => (element.config_code === `welcome_module`) && (parseInt(element.customized_parameter) === 1))[0]
        if (!primaryModule) return this.tool.reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {color: `red`}) 
        this.renderingMsg = await this.tool.reply(this.locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                user: this.user.id,
                command: `welcomer_preview`,
                emoji: this.tool.emoji(`AAUloading`)
            }
        })
        const img = await new GUI(this.message.guild.members.cache.get(this.message.author.id), this.bot).build()
        //  Refresh configurations
        this.config = await this.bot.db.getGuildConfigurations(this.message.guild.id)
        this.logger.info(`${fn} previewing welcomer message for GUILD_ID ${this.message.guild.id}`)
        this.renderingMsg.delete()
        return this.message.channel.send(this._parseWelcomeText(), new MessageAttachment(img, `test_welcome.jpg`))
    }

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @private
     * @returns {string}
     */
    _parseWelcomeText() {
        let config = this.config.filter(element => (element.config_code === `welcome_text`))[0]
        let text = config ? config.customized_parameter : this.bot.welcome_text
        let metadata = {
            guild: this.message.guild.name,
            user: this.message.guild.members.cache.get(this.message.author.id)
        }
        text = text.replace(/{{guild}}/gi, metadata.guild)
        text = text.replace(/{{user}}/gi, metadata.user)
        return text
    }

}

module.exports.help = {
    start: SetWelcomer,
    name: `setWelcomer`,
    aliases: [`setwelcomer`, `setwelcome`, `setwlcm`],
    description: `Manage welcomer module for your guild.`,
    usage: `setWelcomer <subModuleCode>`,
    group: `Manager`,
    permissionLevel: 3,
    multiUser: false
}

