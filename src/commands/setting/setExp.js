const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Enable or disable EXP Leveling System for this guild
 * @author klerikdust
 */
class SetExp extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * An array of the available options for EXP_MODULE module
         * @type {array}
         */
        this.actions = [`enable`, `disable`]

        /**
         * Thumbnail's img source
         * @type {string}
         */
         this.thumbnail = `https://i.ibb.co/Kwdw0Pc/config.png`

        /**
         * Current instance's config code
         * @type {string}
         */  
        this.primaryConfigID = `EXP_MODULE`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETEXP.GUIDE, {
            color: `crimson`,
            thumbnail: this.thumbnail,
            header: `Hi, ${name(this.user.id)}!`,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieDab`)
            }
        })
        //  Handle if the selected options doesn't exists
        this.selectedAction = this.args[0].toLowerCase()
        if (!this.actions.includes(this.selectedAction)) return reply(this.locale.SETEXP.INVALID_ACTION, {
            socket: {actions: this.actions.join(`, `)},
            status: `fail`
        })   
        //  Run action
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        return this[this.selectedAction](...arguments)
    }

    /**
     * Enabling EXP Leveling Module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    async enable({ reply, name, emoji }) {
        const fn = `[setExp.enable()]`
        //  Handle if module already enabled before the action.
        if (this.primaryConfig.value) {
            //  Handle if module used the default value.
            if (!this.primaryConfig.setByUserId) return reply(this.locale.SETEXP.ALREADY_ENABLED_BY_DEFAULT, {
                socket: {emoji: emoji(`AnniePout`)},
                color: `crimson`
            })
            const now = moment()
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETEXP.ALREADY_ENABLED, {
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
        return reply(this.locale.SETEXP.SUCCESSFULLY_ENABLED, {
            socket: {prefix: this.bot.prefix},
            status: `success`
        })
    }

    /**
     * Disabling EXP Leveling Module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {Pistachio.reply}
     */
    async disable({ reply }) {
        const fn = `[setExp.disable()]`
        //  Handle if module already disabled before the action.
        if (!this.primaryConfig.value) return reply(this.locale.SETEXP.ALREADY_DISABLED, {
            socket: {prefix:this.bot.prefix}
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
        return reply(this.locale.SETEXP.SUCCESSFULLY_DISABLED, {status: `success`})
    }
}

module.exports.help = {
    start: SetExp,
    name: `setExp`,
    aliases: [`setexp`, `setexperience`, `setxp`],
    description: `Enable or disable EXP Leveling System for this guild`,
    usage: `setexp <Enable/Disable>`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}

