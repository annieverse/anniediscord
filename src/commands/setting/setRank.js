const Command = require(`../../libs/commands`)
const moment = require(`moment`)
const Experience = require(`../../libs/exp`)
/**
 * Customize role-rank system in the guild.
 * @author Pan
 * @revised by klerikdust
 */
class SetRank extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        /**
         * List of available actions for the current command
         * @type {array}
         */
        this.actions = [`enable`, `add`, `delete`, `info`, `reset`, `disable`]
        /**
         * Thumbnail's img source
         * @type {string}
         */
        this.thumbnail = `https://i.ibb.co/Kwdw0Pc/config.png`
        /**
         * Current instance's config code
         * @type {string}
         */  
        this.configID = `CUSTOM_RANK_MODULE`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(2)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETRANK.GUIDE, {
            header: `Hi, ${name(this.user.id)}!`,
            color: `crimson`,
            thumbnail: this.thumbnail,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieSelfie`)
            }
        })
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return reply(this.locale.SETRANK.INVALID_ACTION, {status: `fail`})
        //  Otherwise, run the action.
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        return this[this.args[0]](...arguments)
    }

    /**
     * Enable Action
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async enable({ reply, name }) {
        //  Fetch from cache
        let config = this.guildConfigurations.get(this.configID)
        if (!config.value && !config.setByUserId) this.firstTimer = true
        //  Handle if the guild already has enabled the configuration
        if (config.value) {
            let localizeTime = await this.bot.db.toLocaltime(config.updatedAt)
            return reply(this.locale.SETRANK.ALREADY_ENABLED, {
            status: `warn`,
                socket: {
                    user: name(config.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Otherwise, update the configuration. Both in the cache and database.
        config.value = 1
        config.setByUserId = this.user.id
        config.updatedAt = await this.bot.db.getCurrentTimestamp()
        this.guildConfigurations.set(this.configID, config) 
        this.bot.db.updateGuildConfiguration({
            configCode: this.configID,
            guild: this.message.guild,
            customizedParameter: 1,
            setByUserId: this.message.author.id
        })
        reply(this.locale.SETRANK.SUCCESSFULLY_ENABLED, {status: `success`})
        //  Spawn tip if user is a first timer
        if (this.firstTimer) return reply(this.locale.SETRANK.FIRST_TIMER_TIP, {
            simplified: true,
            socket: {prefix: this.bot.prefix}
        })
        return true
    }   

    /**
     * Registering new role-rank
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async add({ reply, findRole, trueInt, name }) {
        let subConfigID = `RANKS_LIST`
        let subConfig = this.guildConfigurations.get(subConfigID)
        //  Handle if user doesn't specify the target role name
        if (!this.args[1]) return reply(this.locale.SETRANK.ADD_MISSING_TARGET_ROLE, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1])
        if (!getRole) return reply(this.locale.SETRANK.INVALID_ROLE, {status: `fail`})
        //  Handle if the role is already registered
        const getRegisteredRank = subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length >= 1) {
            const localizeTime = await this.bot.db.toLocaltime(subConfig.updatedAt)
            return reply(this.locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED, {
                header: this.locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED_HEADER,
                socket: {
                    level: getRegisteredRank[0].LEVEL,
                    user: name(subConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    prefix: this.bot.prefix,
                    role: getRole.name
                },
                status: `fail`
            })
        }       
        //  Handle if user doesn't specify the target required level
        if (!this.args[2]) return reply(this.locale.SETRANK.ADD_MISSING_REQUIRED_LEVEL, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        //  Handle if the specified required level is a faulty value/non-parseable number
        const getRequiredLevel = trueInt(this.args[2])
        if (!getRequiredLevel) return reply(this.locale.SETRANK.ADD_INVALID_REQUIRED_LEVEL, {status: `fail`})
        //  Register the rank
        subConfig.setByUserId = this.user.id
        subConfig.updatedAt = await this.bot.db.getCurrentTimestamp()
        subConfig.value.push({
            "ROLE": getRole.id,
            "LEVEL": getRequiredLevel
        })
        await this.guildConfigurations.set(subConfigID, subConfig) 
        await this.bot.db.updateGuildConfiguration({
            configCode: subConfigID,
            guild: this.message.guild,
            customizedParameter: JSON.stringify(subConfig.value),
            setByUserId: this.user.id
        })
        //  Finalize
        reply(this.locale.SETRANK.SUCCESSFULLY_ADDED, {
            status: `success`,
            header: this.locale.SETRANK.SUCCESSFULLY_ADDED_HEADER,
            socket: {
                role: getRole.name,
                level: getRequiredLevel
            }
        })
    }

    /**
     * Deleting a rank-role from the guild's configurations
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async delete({ reply, findRole }) {
        let subConfigID = `RANKS_LIST`
        let subConfig = this.guildConfigurations.get(subConfigID)
        //  Handle if user doesn't specify the target role name
        if (!this.args[1]) return reply(this.locale.SETRANK.DELETE_MISSING_TARGET_ROLE, {status: `warn`})
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1])
        if (!getRole) return reply(this.locale.SETRANK.INVALID_ROLE, {status: `fail`})
        //  Handle if the role hasn't been registered in the first place
        const getRegisteredRank = subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length <= 0) return reply(this.locale.SETRANK.DELETE_UNREGISTERED_ROLE, {status: `fail`})
        //  Delete rank from the guild's configurations entry
        subConfig.setByUserId = this.user.id
        subConfig.updatedAt = await this.bot.db.getCurrentTimestamp()
        subConfig.value = subConfig.value.filter(node => node.ROLE !== getRole.id)
        await this.guildConfigurations.set(subConfigID, subConfig)
        //  Delete entry from guild_configurations if the new array is empty
        if (subConfig.value.length <= 0) {
            await this.bot.db.deleteGuildConfiguration(subConfigID, this.message.guild.id)
        } 
        else {
            await this.bot.db.updateGuildConfiguration({
                configCode: subConfigID,
                guild: this.message.guild,
                customizedParameter: JSON.stringify(subConfig.value),
                setByUserId: this.user.id
            })
        }
        //  Finalize
        return reply(this.locale.SETRANK.SUCCESSFULLY_DELETED, {
            header: this.locale.SETRANK.SUCCESSFULLY_DELETED_HEADER,
            status: `success`,
            socket: {role: getRole.name}
        })
    }       

    /**
     * Displaying the configuration status of current guild
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async info({ reply, name, emoji, commanifier }) {
        const mainConfig = this.guildConfigurations.get(this.configID)
        const subConfig = this.guildConfigurations.get(`RANKS_LIST`)
        //  Handle if the main module is disabled in the guild for the first time
        if (!mainConfig.value && !mainConfig.setByUserId) {
            return reply(this.locale.SETRANK.INFO_DISABLED_FIRST_TIME, {
                color: `red`,
                thumbnail: this.message.guild.iconURL(),
                header: this.locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: emoji(`fail`),
                    prefix: this.bot.prefix,
                    guild: this.message.guild.name
                }
            })
        }
        //  Handle if the main module is disabled for the few times
        const localizeTime = await this.bot.db.toLocaltime(mainConfig.updatedAt)
        if (!mainConfig.value && mainConfig.setByUserId) {
            return reply(this.locale.SETRANK.INFO_DISABLED_BY_USER, {
                color: `red`,
                thumbnail: this.message.guild.iconURL(),
                header: this.locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: emoji(`fail`),
                    prefix: this.bot.prefix,
                    user: name(mainConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    guild: this.message.guild.name
                }
            })
        }
        //  Handle if the main module is enabled, but the guild hasn't setting up the ranks yet.
        if (mainConfig.value && (subConfig.value.length <= 0)) {
            return reply(this.locale.SETRANK.INFO_ENABLED_ZERO_RANKS, {
                color: `lightgreen`,
                thumbnail: this.message.guild.iconURL(),
                header: this.locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: emoji(`success`),
                    prefix: this.bot.prefix,
                    guild: this.message.guild.name
                }
            })
        }
        //  Otherwise, display info like usual
        const localizeSubConfigTime = await this.bot.db.toLocaltime(subConfig.updatedAt)
        return reply(this.locale.SETRANK.INFO_ENABLED, {
            color: `lightgreen`,
            thumbnail: this.message.guild.iconURL(),
            header: this.locale.SETRANK.HEADER_INFO,
            socket: {
                emoji: emoji(`success`),
                rankSize: subConfig.value.length,
                guild: this.message.guild.name,
                list: await this._prettifyList(subConfig.value, ...arguments)
            },
            footer: `Updated by ${name(subConfig.setByUserId)}, ${moment(localizeSubConfigTime).fromNow()}`
        })
    }   

    /**
     * Wipes out all custom ranks configurations in current guild
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async reset({ reply, emoji, commanifier }) {
        let subConfigID = `RANKS_LIST`
        let subConfig = this.guildConfigurations.get(subConfigID)
        let timestamp = await this.bot.db.getCurrentTimestamp()
        //  Handle if guild doesn't have any registered rank.
        if (subConfig.value.length <= 0) return reply(this.locale.SETRANK.RESET_NULL_RANKS, {status: `fail`})
        //  Confirmation before performing the action
        this.confirmation = await reply(``, {header: this.locale.SETRANK.RESET_CONFIRMATION})
        this.addConfirmationButton(`RESET_CONFIRMATION`, this.confirmation, this.user.id)
        this.confirmationButtons.get(`RESET_CONFIRMATION`).on(`collect`, async msg => {
            this.confirmation.delete()
            this.animation = await reply(this.locale.SETRANK.RESET_ANIMATION, {
                simplified: true,
                socket: {
                    guild: `${this.message.guild.name}@${this.message.guild.id}`,
                    emoji: emoji(`AAUloading`)
                }
            })
            //  Reset values
            let mainConfig = this.guildConfigurations.get(this.configID)
            mainConfig.updatedAt = timestamp
            mainConfig.value = 0
            mainConfig.setByUserId = this.user.id
            subConfig.setByUserId = this.user.id
            subConfig.updatedAt = timestamp
            subConfig.value = [] 
            this.guildConfigurations.set(this.configID, mainConfig)
            this.guildConfigurations.set(subConfigID, subConfig)
            await this.bot.db.deleteGuildConfiguration(subConfigID, this.message.guild.id)
            //  Finalize
            this.animation.delete()
            return reply(this.locale.SETRANK.SUCCESSFULLY_RESET, {status: `success`})
        })
    }   

    /**
     * Disables the module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async disable({ reply, name }) {
        let config = this.guildConfigurations.get(this.configID)
        //  Handle if the guild already has disabled the configuration
        if (!config.value) {
            let localizeTime = await this.bot.db.toLocaltime(config.updatedAt)
            return reply(this.locale.SETRANK.ALREADY_DISABLED, {
            status: `warn`,
                socket: {
                    user: name(config.setByUserId),
                    date: moment(localizeTime).fromNow()
                }
            })
        }
        //  Otherwise, update the configuration. Both in the cache and database.
        config.value = 0
        config.setByUserId = this.user.id
        config.updatedAt = await this.bot.db.getCurrentTimestamp()
        await this.guildConfigurations.set(this.configID, config) 
        await this.bot.db.updateGuildConfiguration({
            configCode: this.configID,
            guild: this.message.guild,
            customizedParameter: 0,
            setByUserId: this.message.author.id
        })
        return reply(this.locale.SETRANK.SUCCESSFULLY_DISABLED, {status: `success`})
    }   

    /**
     * Parse & prettify elements from given source.
     * @param {array} [source=[]] refer to guild configuration structure
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     * @returns {string}
     */
    async _prettifyList(source=[], { name, commanifier }) {
        let res = ``
        let expCalc = new Experience({bot: this.bot, message:this.message})
        for (let i=0; i<source.length; i++) {
            if (i <= 0) res += `\n╭───────────────────╮\n\n`
            const rank = source[i]
            const expMeta = await expCalc.xpReverseFormula(rank.LEVEL)
            res += `**• LV${rank.LEVEL} - ${this._getRoleName(rank.ROLE)}**\n> Required EXP: ${commanifier(expMeta.minexp)}\n\n`
            if (i === (source.length-1)) res += `╰───────────────────╯\n`
        }
        return res
    }

    /**
     * Parse role's name. Also adds a fallback to ID if name cannot be found.
     * @param {string} [roleId=``] target role
     * @returns {string}
     */
    _getRoleName(roleId=``) {
        const res = this.message.guild.roles.cache.get(roleId)
        return res ? res.name : roleId
    }
}

module.exports.help = {
    start: SetRank,
    name: `setRank`, 
    aliases: [`setranks`, `setrank`, `setRanks`, `setrnk`], 
    description: `Customize role-rank system in the guild`,
    usage: `setranks`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}