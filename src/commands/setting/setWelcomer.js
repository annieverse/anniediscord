const Command = require(`../../libs/commands`)
const GUI = require(`../../ui/prebuild/welcomer`)
const moment = require(`moment`)
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
        this.actions = [`enable`, `disable`, `channel`, `text`, `role`, `preview`]

        /**
         * Reference key to welcomer sub-modules config code.
         * @type {object}
         */
        this.actionReference = {
            "enable": `WELCOMER_MODULE`,
            "disable": `WELCOMER_MODULE`,
            "channel": `WELCOMER_CHANNEL`,
            "text": `WELCOMER_TEXT`,
            "role": `WELCOMER_ROLES`
        }
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETWELCOMER.GUIDE, {
            image: `banner_setwelcomer`,
            header: `Hi, ${name(this.user.id)}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieGeek`)
            }
        })
        //  Handle if the selected options doesn't exists
        if (!this.actions.includes(this.args[0].toLowerCase())) return reply(this.locale.SETWELCOMER.INVALID_ACTION, {
            socket: {availableActions: this.actions.join(`, `)}
        })   
        //  Run action
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.action = this.args[0]
        this.selectedModule = this.actionReference[this.action]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(`WELCOMER_MODULE`)
        //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.selectedModule) 
        return this[this.args[0].toLowerCase()](...arguments)
    }

    /**
     * Enabling welcomer module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {string}
     */
    async enable({ reply, name }) {
        const fn = `[setWelcomer.enable()]`
        //  Handle if welcomer already enabled before the action.
        if (this.primaryConfig.value) {
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETWELCOMER.ALREADY_ENABLED, {
                socket: {
                    user: name(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 1,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} WELCOMER_MODULE for GUILD_ID:${this.message.guild.id} has been enabled.`)
        return reply(this.locale.SETWELCOMER.SUCCESSFULLY_ENABLED, {
            status: `success`,
            socket: {prefix: this.bot.prefix}
        })
    }

    /**
     * Disabling welcomer module
     * @returns {string}
     */
    async disable({ reply }) {
        const fn = `[setWelcomer.disable()]`
        //  Handle if welcomer already disabled before the action.
        if (!this.primaryConfig.value) return reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}})
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} WELCOMER_MODULE for GUILD_ID:${this.message.guild.id} has been disabled.`)
        return reply(this.locale.SETWELCOMER.SUCCESSFULLY_DISABLED, {status: `success`})
    }

    /**
     * Set new target channel for welcomer module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {string}
     */
    async channel({ reply, emoji }) {
        const fn = `[setWelcomer.channel()]`
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return reply(this.locale.SETWELCOMER.EMPTY_CHANNEL_PARAMETER, {socket: {prefix:this.bot.prefix}})
        //  Do channel searching by three possible conditions
        const searchChannel = this.message.mentions.channels.first()
        || this.message.guild.channels.cache.get(this.args[1])
        || this.message.guild.channels.cache.find(channel => channel.name === this.args[1].toLowerCase())
        //  Handle if target channel couldn't be found
        if (!searchChannel) return reply(this.locale.SETWELCOMER.INVALID_CHANNEL, {socket: {emoji:emoji(`AnnieCry`)} })
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: searchChannel.id,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} WELCOMER_CHANNEL for GUILD_ID:${this.message.guild.id} has been updated.`)
        return reply(this.locale.SETWELCOMER.CHANNEL_SUCCESSFULLY_REGISTERED, {
            status: `success`,
            socket: {channel: `<#${searchChannel.id}>`}
        })
    }

    /**
     * Set message to be attached in the welcomer.
     * @returns {string}
     */
    async text({ reply, emoji }) {
        const fn = `[setWelcomer.text()]`
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if text content isn't provided
        if (!this.args[1]) return reply(this.locale.SETWELCOMER.EMPTY_TEXT_PARAMETER, {
            socket: {prefix: this.bot.prefix},
        })
        //  Update configs
        const welcomerText = this.args.slice(1).join(` `)
        await this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: welcomerText,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} WELCOME_TEXT for GUILD_ID:${this.message.guild.id} has been updated.`)
        await reply(this.locale.SETWELCOMER.TEXT_SUCCESSFULLY_REGISTERED, {status: `success`})
        this.tipsToPreview = await reply(this.locale.SETWELCOMER.TIPS_TO_PREVIEW, {simplified: true, socket: {emoji: emoji(`AnnieSmile`)} })
        this.addConfirmationButton(`SHOULD_PREVIEW?`, this.tipsToPreview, this.user.id)
        this.confirmationButtons.get(`SHOULD_PREVIEW?`).on(`collect`, () => this.preview(...arguments))
    }

    /**
     * Preview this guild's welcomer message
     * @returns {reply}
     */
    async preview({ reply, emoji }) {
        const fn = `[setWelcomer.preview()]`
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        this.renderingMsg = await reply(this.locale.COMMAND.FETCHING, {
            simplified: true,
            socket: {
                user: this.user.id,
                command: `WELCOMER_PREVIEW`,
                emoji: emoji(`AAUloading`)
            }
        })
        const img = await new GUI(this.message.guild.members.cache.get(this.message.author.id), this.bot).build()
        this.logger.info(`${fn} previewing welcomer message for GUILD_ID:${this.message.guild.id}`)
        this.renderingMsg.delete()
        return reply(this._parseWelcomeText(), {
            simplified: true,
            prebuffer: true,
            image: img
        })
    }

    /**
     * Adding role when user joined the guild 
     * @returns {reply}
     */
    async role({ reply, emoji, findRole }) {
        const fn = `[setWelcomer.role()]`
        //  Handle if the user hasn't enabled the module yet
        if (!this.primaryConfig.value) return reply(this.locale.SETWELCOMER.ALREADY_DISABLED, {socket: {prefix:this.bot.prefix}}) 
        //  Handle if search keyword isn't provided
        if (!this.args[1]) return reply(this.locale.SETWELCOMER.EMPTY_ROLE_PARAMETER, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        let rolesContainer = []
        let specifiedRoles = this.args.slice(1)
        for (let i=0; i<specifiedRoles.length; i++) {
            //  Do role searching
            const searchRole = findRole(specifiedRoles[i])
            //  Handle if target role couldn't be found
            if (!searchRole) return reply(this.locale.SETWELCOMER.INVALID_ROLE, {status: `fail`})
            //  Handle if role is higher than annie
            if (searchRole.position > this.annieRole.position) return reply(this.locale.SETWELCOMER.ROLE_TOO_HIGH, {
                color: `crimson`,
                socket: {
                    role: searchRole,
                    annieRole: this.annieRole.name,
                    emoji: emoji(`AnnieCry`)
                }
            })
            rolesContainer.push(searchRole)
        }
        //  Update configs
        await this.bot.db.updateGuildConfiguration({
            configCode: this.selectedModule,
            customizedParameter: rolesContainer.map(role => role.id),
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${rolesContainer.length} new role(s) has been registered for GUILD_ID:${this.message.guild.id}`)
        return reply(this.locale.SETWELCOMER.ROLE_SUCCESSFULLY_REGISTERED, {
            socket: {role: rolesContainer.join(` `)},
            status: `success`
        })
    }

    /**
     * Parse sockets (if available) in the guild's welcomer text.
     * @private
     * @returns {string}
     */
    _parseWelcomeText() {
        let text = this.guildConfigurations.get(`WELCOMER_TEXT`).value
        text = text.replace(/{{guild}}/gi, `**${this.message.guild.name}**`)
        text = text.replace(/{{user}}/gi, this.message.guild.members.cache.get(this.message.author.id))
        return text
    }

}

module.exports.help = {
    start: SetWelcomer,
    name: `setWelcomer`,
    aliases: [`setwelcomer`, `setwelcome`, `setwlcm`],
    description: `Manage welcomer module for your guild.`,
    usage: `setWelcomer`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}
