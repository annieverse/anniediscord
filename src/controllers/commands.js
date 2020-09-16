const { readdirSync } = require(`fs`)
const moment = require(`moment`)
const Pistachio = require(`../libs/pistachio`)
/**
 * @typedef {ClientPrimaryProps}
 * @property {Object} [bot={}] Current <AnnieClient> instance
 * @property {Object} [message={}] Current <Message> instance
 */

/**
 * Centralized Controller to handle incoming command request
 * @since 6.0.0
 * @param {Object} data supplied data from <MessageController>.
 */
class CommandController {
    constructor(data={}) {
        this.bot = data.bot
        this.message = data.message
        this.logger = data.bot.logger

        /**
         * The default identifier for current instance.
         * @type {string}
         */
        this.moduleID = (data.message.channel.type == `dm` || data.modmail) ? `CMD_${data.message.author.id}_${data.message.id}` : `CMD_${data.message.author.id}_${data.message.guild.id}`

        /**
         * The default prop for accessing command's prefix.
         * @since 1.0.0
         * @type {String}
         */
		this.prefix = data.bot.prefix

        /**
         * Tokenize message into an array.
         * @since 1.0.0
         * @type {Array}
         */
        this.messageArray = data.message.content.split(` `)
        
		/**
         * The used command name.
         * @since 1.0.0
         * @type {String}
         */	
        if (data.message.channel.type == `dm` || data.modmail) {
            this.modmail = data.modmail
            if (data.message.content.startsWith(data.bot.prefix)) {
                this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()
            }   
        } else {
            this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()
        }

        /**
         * The default locale properties for command controller.
         * @type {object}
         */ 
        this.locale = data.bot.locale[`en`]

        /**
         * The default property for command cooldown.
         * @type {number}
         */ 
        this.cooldownTime = data.bot.points.cooldown
    }


    /**
     * Running Command Controller. Preparing exceptor on several cases before returning the command file.
     * @returns {CommandClass}
     */
    async run() {
        const fn = `[CommandController.run()] USER_ID:${this.message.author.id}`   
        const now = moment()
        const initTime = process.hrtime()
        this.commandProperties = this.getCommandProperties(this.commandName)

        // Ignore if no files are match with the given command name
        if (!this.commandProperties) return
        // Ignore if user's permission level doesn't met the minimum command's permission requirement
        if (this.isNotEnoughPermissionLevel) return this.logger.debug(`${fn} tries to use PERM_LVL ${this.commandProperties.permissionLevel} command`)
        const Command = this._findFile(this.commandProperties.name)
        if (!Command) return this.logger.debug(`${fn} has failed to find command file with name <${this.commandProperties.name}>`)
        
        const commandComponents = {bot: this.bot, message: this.message, commandProperties: this.commandProperties}
        const PistachioComponents = new Pistachio(commandComponents)

        try {
            //  Handle if command still in cooldown
            const cd = await this.bot.isCooldown(this.moduleID)
            const cooldownToLocalTime = await this.bot.db.toLocaltime(cd)
            if (cd) return PistachioComponents.reply(this.locale.COMMAND.STILL_COOLDOWN, {
                color: `red`,
                socket: {timeLeft: (this.bot.configs.commands.cooldown - now.diff(moment(cooldownToLocalTime), `seconds`, true)).toFixed(2)}
            })
            await new Command(commandComponents).execute(PistachioComponents)
            this.bot.setCooldown(this.moduleID, this.bot.configs.commands.cooldown)

            const cmdFinishTime = this.bot.getBenchmark(initTime)
            const cmdUsageData = {
                guild_id: this.message.guild.id,
                user_id: this.message.author.id,
                command_alias: this.commandName,
                resolved_in: cmdFinishTime
            }

            //	Log and store the cmd usage to database.
            this.logger.info(`${fn} ran ${this.commandName} command (${cmdFinishTime})`)
            return this.bot.db.recordsCommandUsage(cmdUsageData)
        }
        catch(e) {
            this.logger.error(`${fn} ${e}`)
            return PistachioComponents.reply(this.locale.ERROR, {color: `red`, socket:{error: e} })
        }
    }

    /**
     * Running Command(DM) Controller. Preparing exceptor on several cases before returning the command file.
     * @returns {CommandClass}
     */
    async runDM() {
        const fn = `[CommandController.runDM()] USER_ID:${this.message.author.id}`   
        const initTime = process.hrtime()
        if (!this.commandName) {
            // Handle any message that isnt a command
            this.commandProperties = this.getCommandProperties(`newThread`)
            this.commandName = this.commandProperties.name

            // Ignore if no files are match with the given command name
            if (!this.commandProperties) return this.logger.debug(`${fn} Invalid command`)
            // Ignore if user's permission level doesn't met the minimum command's permission requirement
            if (this.isNotEnoughPermissionLevel) return this.logger.debug(`${fn} tries to use PERM_LVL ${this.commandProperties.permissionLevel} command`)
    
            const Command = this._findFile(this.commandProperties.name)
            if (!Command) return this.logger.debug(`${fn} has failed to find command file with name <${this.commandProperties.name}>`)
                        
            const commandComponents = {
                bot: this.bot,
                message: this.message,
                commandProperties: this.commandProperties
            }
            const PistachioComponents = new Pistachio(commandComponents)
            await new Command(commandComponents).execute(PistachioComponents)
            const cmdFinishTime = this.bot.getBenchmark(initTime)

            //	Log and store the cmd usage to database.
            this.logger.info(`${fn} ran ${this.commandName} command (${cmdFinishTime})`)
        } else {
            let allowedCmds = [`ping`, `newThread`, `close`, `anon`, `modlogs`, `showlogs`] // `ping`, `newThread`, `close`, `anon`, `modlogs`, `showlogs` <- This must be allowed for the modmail plugin to work
                
            let specialArg = 1
            if (this.commandName.includes(`modlogs`)) {
                this.commandName.slice(7).length == 0 ? specialArg = 1 : specialArg = this.commandName.slice(7)
                this.commandName = this.commandName.substring(0,7)
            }
            this.commandProperties = this.getCommandProperties(this.commandName)

            // Ignore if no files are match with the given command name
            if (!this.commandProperties) return this.logger.debug(`${fn} Invalid command`)
            // Ignore if user's permission level doesn't met the minimum command's permission requirement
            if (this.isNotEnoughPermissionLevel) return this.logger.debug(`${fn} tries to use PERM_LVL ${this.commandProperties.permissionLevel} command`)
    
            const Command = this._findFile(this.commandProperties.name)
            if (!Command) return this.logger.debug(`${fn} has failed to find command file with name <${this.commandProperties.name}>`)
            if (!allowedCmds.includes(this.commandName)) {
                this.message.author.send(`I'm sorry but the command you are trying isn't allowed in dms`)
                return this.logger.debug(`${fn} has tried using a command file with name <${this.commandProperties.name}> but failed because it is dm blocked`)
            }
            
            const commandComponents = {
                bot: this.bot,
                message: this.message,
                commandProperties: this.commandProperties
            }
            const PistachioComponents = new Pistachio(commandComponents)
            PistachioComponents.specialArg = specialArg
            await new Command(commandComponents).execute(PistachioComponents)
            const cmdFinishTime = this.bot.getBenchmark(initTime)

            //	Log and store the cmd usage to database.
            this.logger.info(`${fn} ran ${this.commandName} command (${cmdFinishTime})`)
        }
    }

	/**
	 * Browser through filedisk and Find command file with the given keyword 
	 * @param {String} filename source filename
	 * @returns {CommandComponentClass}
	 */
	_findFile(filename) {
		if (!filename) throw new TypeError(`[CommandController._findFile()] parameter "filename" cannot be blank.`)
		if (!filename.endsWith(`.js`)) filename = filename + `.js`
		/**
		 * Recursively pull available categories in command's root directory
		 * @example user/system/social/shop/etc
		 */
		let directories = readdirSync(`./src/commands/`).filter(file => !file.includes(`.`))
		for (const index in directories) {
			const dir = directories[index]
			/**
			 * Recursively pull files from a category
			 * @example user/system/social/shop/etc
			 */
			const files = readdirSync(`./src/commands/` + dir)
			const newPath = `../commands/${dir}/${filename}`
			if (files.includes(filename)) return require(newPath).help.start
		}
		return null
    }
    
	/**
	 * Fetch command's properties from registered commands in client properties.
	 * @since 6.0.0
	 * @param {String} commandName target command name
	 * @returns {CommandObject}
	 */
	getCommandProperties(commandName=``) {
		const fn = `[Commands.getCommandProperties()]`
        if (!commandName) throw new TypeError(`${fn} parameter "commandName" cannot be blank.`)
        const res = this.bot.commands.names.get(commandName) || this.bot.commands.names.get(this.bot.commands.aliases.get(commandName))
        if (!res) return null
		return res.help
    }
    
	get isNotEnoughPermissionLevel() {
		return this.commandProperties.permissionLevel > this.message.author.permissions.level
	}

}

module.exports = CommandController