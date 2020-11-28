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
         * Banner's img source
         * @type {string}
         */
        this.banner = `https://i.ibb.co/HPHYHDf/setrank.png`
        /**
         * Current instance's config code
         * @type {string}
         */  
        this.primaryConfigID = `CUSTOM_RANK_MODULE`
        /**
         * Current instance's sub config code
         * @type {string}
         */  
        this.subConfigID = `RANKS_LIST`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETRANK.GUIDE, {
            header: `Hi, ${name(this.user.id)}!`,
            prebuffer: true,
            image: this.banner,
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieSelfie`)
            }
        })
        //  Handle if selected action doesn't exists
        if (!this.actions.includes(this.args[0])) return reply(this.locale.SETRANK.INVALID_ACTION, {status: `fail`})
        //  Otherwise, run the action.
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.action = this.args[0]
        //  This is the main configuration of setwelcomer, so everything dependant on this value
        this.primaryConfig = this.guildConfigurations.get(this.primaryConfigID)
        //  This is the sub-part of main configuration such as welcomer's channel, text, etc
        this.subConfig = this.guildConfigurations.get(this.subConfigID) 
        return this[this.args[0]](...arguments)
    }

    /**
     * Enable Action
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async enable({ reply, name }) {
        const fn = `[setRank.enable()]`
        //  Handle first timer
        if (!this.primaryConfig.value && !this.primaryConfig.setByUserId) this.firstTimer = true
        //  Handle if custom ranks already enabled before the action.
        if (this.primaryConfig.value) {
            let localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.SETRANK.ALREADY_ENABLED, {
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
    async add({ reply, findRole, trueInt, name, emoji }) {
        const fn = `[setRank.add()]`
        //  Handle if user doesn't specify the target role name
        if (!this.args[1]) return reply(this.locale.SETRANK.ADD_MISSING_TARGET_ROLE, {
            socket: {prefix: this.bot.prefix},
            status: `warn`
        })
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1])
        if (!getRole) return reply(this.locale.SETRANK.INVALID_ROLE, {socket:{emoji:emoji(`AnnieCry`)} })
        //  Handle if target role is too high
        if (getRole.position > this.annieRole.position) return reply(this.locale.SETRANK.ROLE_TOO_HIGH, {
            socket: {
                role: getRole,
                annieRole: this.annieRole.name,
                emoji: emoji(`AnnieCry`)
            }
        })
        //  Handle if the role is already registered
        const getRegisteredRank = this.subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length >= 1) {
            const localizeTime = await this.bot.db.toLocaltime(this.subConfig.updatedAt)
            return reply(this.locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED, {
                header: this.locale.SETRANK.ADD_ROLE_ALREADY_REGISTERED_HEADER,
                socket: {
                    level: getRegisteredRank[0].LEVEL,
                    user: name(this.subConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    prefix: this.bot.prefix,
                    role: getRole.name.toLowerCase()
                },
            })
        }       
        //  Handle if user doesn't specify the target required level
        if (!this.args[2]) return reply(this.locale.SETRANK.ADD_MISSING_REQUIRED_LEVEL, {
            socket: {
                prefix: this.bot.prefix,
                role: getRole.name.toLowerCase()
            },
        })
        //  Handle if the specified required level is a faulty value/non-parseable number
        const getRequiredLevel = trueInt(this.args[2])
        if (!getRequiredLevel) return reply(this.locale.SETRANK.ADD_INVALID_REQUIRED_LEVEL, {status: `fail`})
        //  Update configs
        this.subConfig.value.push({
            "ROLE": getRole.id,
            "LEVEL": getRequiredLevel
        })
        await this.bot.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: this.subConfig.value,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        //  Finalize
        this.logger.info(`${fn} added new role-rank(${getRole.id}) for GUILD_ID:${this.message.guild.id}`)
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
    async delete({ reply, findRole, emoji }) {
        const fn = `[setRank.delete()]`
        //  Handle if user doesn't specify the target role name
        if (!this.args[1]) return reply(this.locale.SETRANK.DELETE_MISSING_TARGET_ROLE, {socket: {emoji:emoji(`AnnieYandere`)}})
        //  Handle if target role doesn't exists
        const getRole = findRole(this.args[1])
        if (!getRole) return reply(this.locale.SETRANK.INVALID_ROLE, {socket: {emoji:emoji(`AnnieCry`)}})
        //  Handle if the role hasn't been registered in the first place
        const getRegisteredRank = this.subConfig.value.filter(node => node.ROLE === getRole.id)
        if (getRegisteredRank.length <= 0) return reply(this.locale.SETRANK.DELETE_UNREGISTERED_ROLE, {socket: {emoji:emoji(`AnnieMad`)}})
        //  Delete rank from the guild's configurations entry
        this.subConfig.value = this.subConfig.value.filter(node => node.ROLE !== getRole.id)
        await this.bot.db.updateGuildConfiguration({
            configCode: this.subConfigID,
            customizedParameter: this.subConfig.value,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        //  Finalize
        this.logger.info(`${fn} deleted role-rank(${getRole.id}) from GUILD_ID:${this.message.guild.id}`)
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
        //  Handle if the main module is disabled in the guild for the first time
        if (!this.primaryConfig.value && !this.primaryConfig.setByUserId) {
            return reply(this.locale.SETRANK.INFO_DISABLED_FIRST_TIME, {
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
        const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
        if (!this.primaryConfig.value && this.primaryConfig.setByUserId) {
            return reply(this.locale.SETRANK.INFO_DISABLED_BY_USER, {
                thumbnail: this.message.guild.iconURL(),
                header: this.locale.SETRANK.HEADER_INFO,
                socket: {
                    emoji: emoji(`fail`),
                    prefix: this.bot.prefix,
                    user: name(this.primaryConfig.setByUserId),
                    date: moment(localizeTime).fromNow(),
                    guild: this.message.guild.name
                }
            })
        }
        //  Handle if the main module is enabled, but the guild hasn't setting up the ranks yet.
        if (this.primaryConfig.value && (this.subConfig.value.length <= 0)) {
            return reply(this.locale.SETRANK.INFO_ENABLED_ZERO_RANKS, {
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
        const localizeSubConfigTime = await this.bot.db.toLocaltime(this.subConfig.updatedAt)
        return reply(this.locale.SETRANK.INFO_ENABLED, {
            status: `success`,
            thumbnail: this.message.guild.iconURL(),
            header: this.locale.SETRANK.HEADER_INFO,
            socket: {
                emoji: emoji(`success`),
                rankSize: this.subConfig.value.length,
                guild: this.message.guild.name,
                list: await this._prettifyList(this.subConfig.value, ...arguments)
            },
            footer: `Updated by ${name(this.subConfig.setByUserId)}, ${moment(localizeSubConfigTime).fromNow()}`
        })
    }   

    /**
     * Wipes out all custom ranks configurations in current guild
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async reset({ reply, emoji, commanifier }) {
        const fn = `[setRank.reset()]`
        let timestamp = await this.bot.db.getCurrentTimestamp()
        //  Handle if guild doesn't have any registered rank.
        if (this.subConfig.value.length <= 0) return reply(this.locale.SETRANK.RESET_NULL_RANKS, {status: `fail`})
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
            this.primaryConfig.updatedAt = timestamp
            this.primaryConfig.value = 0
            this.primaryConfig.setByUserId = this.user.id
            this.subConfig.setByUserId = this.user.id
            this.subConfig.updatedAt = timestamp
            this.subConfig.value = [] 
            await this.bot.db.deleteGuildConfiguration(this.subConfigID, this.message.guild.id)
            //  Finalize
            this.animation.delete()
            this.logger.info(`${fn} custom ranks configurations for GUILD_ID:${this.message.guild.id} has been reset.`)
            return reply(this.locale.SETRANK.SUCCESSFULLY_RESET, {status: `success`})
        })
    }   

    /**
     * Disables the module
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async disable({ reply, name }) {
        const fn = `[setRank.disable()]`
        //  Handle if the guild already has disabled the configuration
        if (!this.primaryConfig.value) return reply(this.locale.SETRANK.ALREADY_DISABLED, {socket:{prefix:this.bot.prefix}})
        //  Otherwise, update the configuration. Both in the cache and database.
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.message.guild,
            setByUserId: this.user.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} CUSTOM_RANK_MODULE has been disabled for GUILD_ID:${this.message.guild.id}`)
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
        let arr = []
        let expCalc = new Experience({bot: this.bot, message:this.message})
        for (let i=0; i<source.length; i++) {
            if (i <= 0) res += `\n╭*:;,．★ ～☆*──────────╮\n\n`
            const rank = source[i]
            const expMeta = await expCalc.xpReverseFormula(rank.LEVEL)
            res += `**• LV${rank.LEVEL} - ${this._getRoleName(rank.ROLE)}**\n> Required EXP: ${commanifier(expMeta.minexp)}\n\n`
            if (i === (source.length-1)) res += `╰──────────☆～*:;,．*╯\n`
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