const Command = require(`../../libs/commands`)
const moment = require(`moment`)
/**
 * Create a set of autoresponder!
 * @author klerikdust
 */
class AutoResponder extends Command {
    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        
        /**
         * Maximum characters for the trigger.
         * @type {number}
         */
        this.triggerCharLimit = 156

        /**
         * Maximum characters for the response.
         * @type {number}
         */
        this.responseCharLimit = 1900
        
        /**
         * List of available actions.
         * @type {array}
         */
        this.availableActions = [`enable`, `add`, `delete`, `info`, `reset`, `disable`]

        /**
         * Primary ID for current module
         * @type {string}
         */
        this.primaryConfigID = `AR_MODULE`
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async execute({ reply, name, emoji }) {
        await this.requestUserMetadata(1)
        this.guildConfigurations = this.bot.guilds.cache.get(this.message.guild.id).configs
        this.primaryConfig = this.guildConfigurations.get(`AR_MODULE`)
		//  Handle if user doesn't specify any parameter.
		if (!this.fullArgs) return reply(this.locale.AUTORESPONDER.GUIDE, {
            image: `banner_autoresponder`,
            header: `Hi, ${name(this.user.master.id)}!`,
			socket:{
                emoji: emoji(`AnnieYay`),
                guild: this.guild.name,
                prefix: this.bot.prefix,
                statusEmoji: emoji(this.primaryConfig.value ? `success` : `fail`),
                status: this.primaryConfig.value ? `enabled` : `disabled`
            }
        })
        //  Handle if the used action is invalid
        this.selectedAction = this.args[0].toLocaleLowerCase()
        if (!this.availableActions.includes(this.selectedAction)) return reply(this.locale.AUTORESPONDER.INVALID_ACTION, {
            socket: {
                actions: this._parseAvailableActions(),
                emoji: emoji(`AnnieThinking`)
            }
        })
        //  Run action
        return this[this.args[0]](...arguments)
	}

    /**
     * Enabling AR module.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async enable({ reply, emoji, name }) {
        const fn = `[AutoResponder.enable()]`
        //  Handle if module already enabled
        if (this.primaryConfig.value) {
            const localizeTime = await this.bot.db.toLocaltime(this.primaryConfig.updatedAt)
            return reply(this.locale.AUTORESPONDER.ALREADY_ENABLED, {
                socket: {
                    emoji: emoji(`AnnieThinking`),
                    user: name(this.primaryConfig.setByUserId),
                    time:  moment(localizeTime).fromNow()
                }
            })
        }
        //  Update configurations
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 1,
            guild: this.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.guild.id} has been enabled.`)
        return reply(this.locale.AUTORESPONDER.SUCCESSFULLY_ENABLED, {
            socket: {emoji: emoji(`hearts`)},
            status: `success`
        })
    }

    /**
     * Disabling AR module.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async disable({ reply, emoji }) {
        const fn = `[AutoResponder.disable()]`
        //  Handle if module already disabled
        if (!this.primaryConfig.value) {
            return reply(this.locale.AUTORESPONDER.ALREADY_DISABLED, {
                socket: {
                    prefix: this.bot.prefix,
                    emoji: emoji(`AnnieCry`)
                }
            })
        }
        //  Update configurations
        await this.bot.db.updateGuildConfiguration({
            configCode: this.primaryConfigID,
            customizedParameter: 0,
            guild: this.guild,
            setByUserId: this.user.master.id,
            cacheTo: this.guildConfigurations
        })
        this.logger.info(`${fn} ${this.primaryConfigID} for GUILD_ID:${this.guild.id} has been disabled.`)
        return reply(this.locale.AUTORESPONDER.SUCCESSFULLY_DISABLED, {
            socket: {emoji: emoji(`AnnieSmile`)},
            status: `success`
        })
    }


    /**
     * Displaying the registered ARs.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async info({ reply, emoji, name, bot:{db} }) {
        //  Fetch registered ARs.
        const ars = await db.getAutoResponders(this.guild.id)
        //  Handle if there are no registered ARs.
        if (ars.length <= 0) return reply(this.locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: emoji(`AnnieThinking`),
                prefix: this.bot.prefix
            }
        })
        const localizedTime = await db.toLocaltime(ars[0].registered_at)
        return reply(this.locale.AUTORESPONDER.DISPLAY, {
            thumbnail: this.guild.iconURL(),
            header: `Learned ARs`,
            socket: {
                emoji: emoji(`AnnieHype`),
                list: this._parseRegisteredAutoResponders(ars),
                ars: ars.length,
                guild: this.guild.name,
                user: name(ars[0].user_id),
                time: moment(localizedTime).fromNow()
            }
        })
    }

    /**
     * Registering new AR.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async add({ reply, emoji, avatar, bot:{db} }) {
        //  Handle if user didn't put any additional parameters
        if (!this.args[1]) return reply(this.locale.AUTORESPONDER.REGISTER_NO_PARAM, {
            socket: {prefix: this.bot.prefix}
        })
        const msg = this.args.slice(1).join(` `)
        const splittedContext = msg.split(` - `)
        const trigger = splittedContext[0]
        //  Handle if user hasn't included separator for trigger and separator
        if (!msg.includes(`-`)) return reply(this.locale.AUTORESPONDER.REGISTER_MISSING_SEPARATOR, {
            socket: {
                prefix: this.bot.prefix,
                trigger: trigger
            }
        })
        //  Handle if response is empty
        const response = splittedContext[1]
        if (!response) return reply(this.locale.AUTORESPONDER.REGISTER_EMPTY_RESPONSE, {
            socket: {
                prefix: this.bot.prefix,
                emoji: emoji(`AnnieThinking`),
                trigger: trigger
            }
        })
        //  Display AR confirmation
        this.registerConfirmation = await reply(this.locale.AUTORESPONDER.REGISTER_CONFIRMATION, {
            thumbnail: avatar(this.user.master.id),
            socket: {
                trigger: trigger,
                response: response
            }
        })
		await this.addConfirmationButton(`register_confirmation`, this.registerConfirmation)
 		return this.confirmationButtons.get(`register_confirmation`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: emoji(`AnnieSleep`)}
			})
            //  Register
            db.registerAutoResponder({
                guildId: this.guild.id,
                userId: this.user.master.id,
                trigger: trigger,
                response: response
            })
            //  Finalize
            this.finalizeConfirmation(r)
            await reply(this.locale.AUTORESPONDER.REGISTER_SUCCESSFUL, {
                socket: {emoji:emoji(`hearts`)}
            })
            reply(this.locale.AUTORESPONDER.REGISTER_FOOTER_TIP, {
                simplified: true,
                socket: {
                    trigger: trigger,
                    emoji: emoji(`AnnieHype`)
                }
            })
        })
    }

    /**
     * Deleting AR.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async delete({ reply, emoji, bot:{db} }) {
        //  Handle if guild does not have any ARs to be deleted
        const ars = await db.getAutoResponders(this.guild.id)
        if (ars.length <= 0) return reply(this.locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: emoji(`AnnieThinking`),
                prefix: this.bot.prefix
            }
        })
        //  Handle if user doesn't provide the keyword.
        const keyword = this.args.slice(1).join(` `)
        if (!keyword.length) return reply(this.locale.AUTORESPONDER.DELETE_MISSING_KEYWORD, {
            socket: {
                guild: this.guild.name,
                prefix: this.bot.prefix,
                list: this._parseRegisteredAutoResponders(ars, true)
            }
        })
        //  Handle if target AR to be deleted does not exists.
        let targetAR = ars.filter(ar => (ar.ar_id === parseInt(keyword)) || (ar.trigger === keyword.toLowerCase()))
        if (!targetAR.length) return reply(this.locale.AUTORESPONDER.DELETE_TARGET_INVALID, {
            socket:{emoji:emoji(`AnniePeek1`)}
        })
        //  Performs deletion
        targetAR = targetAR[0]
        await db.deleteAutoResponder(targetAR.ar_id, this.guild.id)   
        return reply(this.locale.AUTORESPONDER.SUCCESSFULLY_DELETED, {
            socket: {emoji:emoji(`hearts`)},
            status: `success`
        })
    }

    /**
     * Deletes all the registered ARs from specific server.
     * @param {PistachioMethods} Object pull any pistachio's methods in here
     * @return {void}
     */
    async reset({ reply, emoji, bot:{db} }) {
        //  Handle if guild does not have any ARs to be deleted
        const ars = await db.getAutoResponders(this.guild.id)
        if (ars.length <= 0) return reply(this.locale.AUTORESPONDER.EMPTY, {
            socket: {
                emoji: emoji(`AnnieThinking`),
                prefix: this.bot.prefix
            }
        })
        //  Reset confirmation
        this.resetConfirmation = await reply(this.locale.AUTORESPONDER.RESET_CONFIRMATION, {
            socket: {
                totalArs: ars.length,
                emoji: emoji(`AnnieCry`)
            }
        })
		await this.addConfirmationButton(`reset_confirmation`, this.resetConfirmation)
 		return this.confirmationButtons.get(`reset_confirmation`).on(`collect`, async r => {
			//  Handle cancellation
			if (this.isCancelled(r)) return reply(this.locale.ACTION_CANCELLED, {
				socket: {emoji: emoji(`AnnieSleep`)}
			})
            //  Wipeout ARs
            db.clearAutoResponders(this.guild.id)
            this.finalizeConfirmation(r)
            reply(this.locale.AUTORESPONDER.SUCCESSFULLY_RESET, {
                socket: {totalArs: ars.length}
            })
        })
    }

    /**
     * Parsing registered ARs into proper format.
     * @param {array} [src=[]] ARs source.
     * @return {string}
     */
    _parseRegisteredAutoResponders(src=[], simplified=false) {
        let str = ``
        for (let i=0; i<src.length; i++) {
            const ar = src[i]
            if (simplified) {
                str += `╰☆～(ID:${ar.ar_id}) **${ar.trigger}**\n`
                continue
            }
            str += `[ID:${ar.ar_id}]** "${ar.trigger}"**\n> Annie's Response: ${ar.response}${(i+1) === src.length ? `` : `\n⸻⸻⸻⸻\n`}`
        }
        return str
    }

    /**
     * Parsing available actions into proper format.
     * @return {string}
     */
    _parseAvailableActions() {
        let str = ``
        for (let i=0; i<this.availableActions.length; i++) {
            const action = this.availableActions[i]
            if ((i+1) === this.availableActions.length) {
                str += ` and **\`${action}\`**`
                break
            }
            str += `**\`${action}\`**, `
        }
        return str
    }
}

module.exports.help = {
	start: AutoResponder,
	name: `autoRespond`,
	aliases: [`autorespond`, `ar`, `autoresponse`, `autorespons`],
	description: `Create a set of autoresponder!`,
	usage: `ar`,
	group: `Setting`,
	permissionLevel: 2,
	multiUser: false
}
