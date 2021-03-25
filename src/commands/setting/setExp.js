const Command = require(`../../libs/commands`)
const moment = require(`moment`)
const User = require(`../../libs/user`)
const GUI = require(`../../ui/prebuild/level`)
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
        this.actions = [`enable`, `disable`, `add`, `minus`, `reset`]

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

		/**
		 * Soft limit exp addition
		 * type {number}
		 */
		this.softLimit = 1000000
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        //  Handle if user doesn't specify any arg
        if (!this.fullArgs) return reply(this.locale.SETEXP.GUIDE, {
            thumbnail: this.thumbnail,
            header: `Hi, ${name(this.user.master.id)}!`,
			image: `banner_setexp`,
            socket: {
                prefix: this.bot.prefix,
                emoji: await emoji(`692428597570306218`)
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
                socket: {emoji: await emoji(`692428843058724994`)},
                color: `crimson`
            })
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
            setByUserId: this.user.master.id,
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
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.message.guild.id} has been disabled.`)
        return reply(this.locale.SETEXP.SUCCESSFULLY_DISABLED, {status: `success`})
    }

	/**
	 * Substraction exp action.
	 * @return {void}
	 */
	async minus({ emoji, reply, trueInt }) {
		if (!this.args[1]) return reply(this.locale.SETEXP.MISSING_USER_ON_MINUS, {
			socket: {
				prefix: this.bot.prefix
			}
		})
		const userClass = new User(this.bot, this.message)
		const targetUser = await userClass.lookFor(this.args[1])
		if (!targetUser) return reply(this.locale.USER.IS_INVALID)
		if (!this.args[2]) return reply(this.locale.SETEXP.MISSING_AMOUNT_ON_MINUS, {
			socket: {
				prefix: this.bot.prefix,
				user: targetUser.master.username
			}
		})
		const amountToSubtract = trueInt(this.args[2])
		if (!amountToSubtract) return reply(this.locale.SETEXP.INVALID_AMOUNT_TO_MINUS, {
			socket: {
				prefix: this.bot.prefix,
				user: targetUser.master.username
			}
		})
		let baseData = await userClass.requestMetadata(targetUser.master, 2) 
		const combinedExp = baseData.exp.current_exp - amountToSubtract
		if (combinedExp <= 0) return reply(this.locale.SETEXP.MINUS_OVERLIMIT, {
			socket: {
				user: targetUser.master.username,
				emoji: await emoji(`692428748838010970`)
			}
		})
		let newData = this.bot.experienceLibs(this.message).xpFormula(combinedExp)
		baseData.exp = {
			current_exp: combinedExp,
			level: newData.level,
			maxexp: newData.maxexp,
			nextexpcurve: newData.nextexpcurve,
			minexp: newData.minexp
		} 
		const confirmation = await reply(this.locale.SETEXP.MINUS_CONFIRMATION, {
			prebuffer: true,
			image: await new GUI(baseData).build(),
			socket: {
				user: targetUser.master.username
			}
		}) 
		await this.addConfirmationButton(`exp_subtraction`, confirmation)
 		return this.confirmationButtons.get(`exp_subtraction`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
    		this.bot.db.subtractUserExp(amountToSubtract, targetUser.master.id, this.message.guild.id)
 			this.finalizeConfirmation(r)
 			reply(``, {
 				customHeader: [`${targetUser.master.username} exp has been updated!♡`, targetUser.master.displayAvatarURL()],
 			})
 		})
	}

	/**
	 * Addition EXP action.
	 * @return {void}
	 */
	async add({ emoji, reply, commanifier, trueInt }) {
		if (!this.args[1]) return reply(this.locale.SETEXP.MISSING_USER_ON_ADD, {
			socket: {
				prefix: this.bot.prefix
			}
		})
		const userClass = new User(this.bot, this.message)
		const targetUser = await userClass.lookFor(this.args[1])
		if (!targetUser) return reply(this.locale.USER.IS_INVALID)
		if (!this.args[2]) return reply(this.locale.SETEXP.MISSING_AMOUNT_ON_ADD, {
			socket: {
				prefix: this.bot.prefix,
				user: targetUser.master.username
			}
		})
		const amountToAdd = trueInt(this.args[2])
		if (!amountToAdd) return reply(this.locale.SETEXP.INVALID_AMOUNT_TO_ADD, {
			socket: {
				prefix: this.bot.prefix,
				user: targetUser.master.username
			}
		})
		if (amountToAdd > this.softLimit) return reply(this.locale.SETEXP.ADD_OVERLIMIT, {
			socket: {
				emoji: await emoji(`692428578683617331`),
				amount: commanifier(this.softLimit)
			}
		})
		let baseData = await userClass.requestMetadata(targetUser.master, 2) 
		const combinedExp = baseData.exp.current_exp + amountToAdd
		let newData = this.bot.experienceLibs(this.message).xpFormula(combinedExp)
		baseData.exp = {
			current_exp: combinedExp,
			level: newData.level,
			maxexp: newData.maxexp,
			nextexpcurve: newData.nextexpcurve,
			minexp: newData.minexp
		} 
		const confirmation = await reply(this.locale.SETEXP.ADD_CONFIRMATION, {
			prebuffer: true,
			image: await new GUI(baseData).build(),
			socket: {
				user: targetUser.master.username
			}
		}) 
		await this.addConfirmationButton(`exp_addition`, confirmation)
 		return this.confirmationButtons.get(`exp_addition`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
    		this.bot.db.addUserExp(amountToAdd, targetUser.master.id, this.message.guild.id)
 			this.finalizeConfirmation(r)
 			reply(``, {
 				customHeader: [`${targetUser.master.username} exp has been updated!♡`, targetUser.master.displayAvatarURL()],
 			})
 		})
	}

	/**
	 * Reset user'e exp to zero.
	 * @return {void}
	 */
	async reset({ emoji, reply }) {
		if (!this.args[1]) return reply(this.locale.SETEXP.MISSING_USER_ON_RESET, {
			socket: {
				prefix: this.bot.prefix,
				emoji: await emoji(`692428692999241771`)
			}
		})
		const userClass = new User(this.bot, this.message)
		const targetUser = await userClass.lookFor(this.args.slice(1).join(` `))
		if (!targetUser) return reply(this.locale.USER.IS_INVALID)
		let baseData = await userClass.requestMetadata(targetUser.master, 2) 
		let newData = this.bot.experienceLibs(this.message).xpFormula(0)
		baseData.exp = {
			current_exp: 0,
			level: newData.level,
			maxexp: newData.maxexp,
			nextexpcurve: newData.nextexpcurve,
			minexp: newData.minexp
		} 
		const confirmation = await reply(this.locale.SETEXP.RESET_CONFIRMATION, {
			prebuffer: true,
			image: await new GUI(baseData).build(),
			socket: {
				user: targetUser.master.username
			}
		})
		await this.addConfirmationButton(`exp_reset`, confirmation)
		return this.confirmationButtons.get(`exp_reset`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: await emoji(`781954016271138857`)}
			})
    		this.bot.db.resetUserExp(targetUser.master.id, this.message.guild.id)
 			this.finalizeConfirmation(r)
 			reply(``, {
 				customHeader: [`${targetUser.master.username} exp has been wiped out!♡`, targetUser.master.displayAvatarURL()],
 			})
 		})
	}
}

module.exports.help = {
    start: SetExp,
    name: `setExp`,
    aliases: [`setexp`, `setexperience`, `setxp`],
    description: `Configure the exp for your member and the server.`,
    usage: `setexp`, 
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}

