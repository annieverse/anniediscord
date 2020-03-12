`use-strict`

const User = require(`./user`)
const { readdirSync } = require(`fs`)
const Data = require(`../utils/userdataSelector`)
const Pistachio = require(`./pistachio`)


/**
 * Commands Handler
 * @param {Object} data preferably follow the structure in `stacks` variable (./events/message.js)
 */ 
class Commands {
	constructor(bot, message) {
		this.bot = bot
		this.message = message

        /**
         * The default prop for accessing command's prefix.
         * @since 1.0.0
         * @type {String}
         */
		this.prefix = bot.prefix

        /**
         * Tokenized message into an array.
         * @since 1.0.0
         * @type {Array}
         */
		this.messageArray = message.content.split(` `)


		/**
		 *  ----------------------------------------------------
		 *  ARGUMENTS
		 *  ----------------------------------------------------
		 * 
         * Tokenized arguments. Except, no command name included.
         * @since 1.0.0
         * @type {String}
         */	
		this.args = this.messageArray.slice(1)

        /**
         * Untokenized arguments. Except, no command name included.
         * @since 1.0.0
         * @type {String}
         */	
		this.fullArgs = this.args.join(` `)

		/**
		 *  ----------------------------------------------------
		 *  COMMANDS PROPERTIES
		 *  ----------------------------------------------------
         * The used command name.
         * @since 1.0.0
         * @type {String}
         */	
		this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()
		
		/**
         * User lib
         * @since 6.0.0
         * @type {UserClass}
         */	
		this.userClass = new User(bot, message)

		this.logger = bot.logger
	
	}


	/**
	 * 	Running the command
	 * 	@init
	 */
	async init() {
		const logCode = `[Command.init()] GUILD:${this.message.guild.id} USER:${this.message.author.id} PERM_LVL:${this.message.author.permissions.level}`
		try {
			const initTime = process.hrtime()
			this.commandProperties = this.getCommandProperties(this.commandName)

			/**
			 *  ----------------------------------------------------
			 *  EXCEPTOR
			 *  ----------------------------------------------------
			 */
			// Ignore if no files are match with the given command name
			if (!this.commandProperties) return this.logger.debug(`Invalid command`)
			// Ignore if user's permission level doesn't met the minimum command's permission requirement
			if (this.isNotEnoughPermissionLevel) return this.logger.debug(`${logCode} tries to use LV${this.commandProperties.permissionLevel} command`)
			
			// Select and assign user's metadata
			this._userSelector()
			await this._requestUserMetadata()

			const cmd = this._findFile(this.commandProperties.help.name)
			const PistachioComponents = new Pistachio({bot:this.bot, message:this.message})
			await new cmd(PistachioComponents).execute()
			
			const cmdFinishTime = this.bot.getBenchmark(initTime)
			const cmdUsageData = {
				guild_id: this.data.message.guild.id,
				user_id: this.data.message.author.id,
				command_alias: this.commandName,
				resolved_in: cmdFinishTime
			}
		
			//	Log and store the cmd usage to database.
			this.logger.info(`${logCode} ran ${command} command (${cmdFinishTime})`)
			this.bot.db.recordsCommandUsage(cmdUsageData)
			
		}
		catch (e) {
			this.logger.error(`${logCode} has failed to run ${this.commandName} > ${e.stack}`)
		}
	}

	/**
	 * ----------------------------------------------------
	 *  PRIVATES
	 * ----------------------------------------------------
	 */

	/**
	 * Browser through filedisk and Find command file with the given keyword 
	 * @param {String} filename source filename
	 * @returns {CommandComponentClass}
	 */
	_findFile(filename) {
		if (!filename) throw new TypeError(`[Commands._findFile()] parameter "filename" cannot be blank.`)
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
	async _requestUserMetadata() {
		this.user.meta = await this.userClass.requestMetadata(this.user.id)
		return true
	}
	_userSelector() {
		this.user = this.commandProperties.multiUser && this.args ? this.userClass.lookFor(this.args) : this.userClass.lookFor(this.message.author.id)
		return true
	}


	get isNotEnoughPermissionLevel() {
		return this.commandProperties.permissionLevel < this.message.author.permissions.level
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
		return this.bot.commands.names.get(commandName) || this.bot.commands.names.get(this.bot.commands.aliases.get(commandName))
	}


	/**
	 * 	Verifying if the required properties are already stored
	 * 	@propertiesAreReady
	 */
	async componentsAreReady() {

		var self = this.self 
		function deleteObjectFromArr(arr, obj) {
			var index = arr.indexOf(obj)
			if (index > -1) {
				arr.splice(index, 1)
			}
			self.componentsAreReady()
		}

		if (this.data.args.includes(` `)) deleteObjectFromArr(this.data.args, ` `)
		if (this.data.args.includes(``)) deleteObjectFromArr(this.data.args, ``)

		try {
			if (!this.data.meta.author) return false
			if (!this.data.meta.data) return false
			if (!this.data.command) return false
			if (!this.data.args) return false
			if (!this.data.commandfile) return false

			return true
		}
		catch (e) {
			this.logger.error(`Command's Components are failed to load. > `, e)
		}
	}


	/**
	 * 	Preparing components and double checking
	 * 	@prepare
	 */
	async prepare() {

		//	File validation
		if (!this.data.commandfile) return 

		//	Ref to file path
		this.path = `../modules/commands/${this.filename}.js`

		//	Get the available properties
		this.module_parameters = require(this.path).help
		
		// Test if command is avaible to public
		if (!this.module_parameters.public && this.module_parameters.public != null){
			if (!this.isUserADev){
				return this.logger.info(`${this.data.message.author.tag} trying to use non public command(${this.data.command}) in #${this.data.message.channel.name}`)
			}
		} 


		/**
		 * 	Commented this line.
		 * 	So the command works outside of current AAU's configuration.
		 */
		//if (!this.isUserADev && this.module_parameters.group.toLowerCase() === (`developer`||`dev`)) return this.logger.info(`${this.data.message.author.tag} trying to use dev only command(${this.data.command}) in #${this.data.message.channel.name}`)
		//if ((!this.isUserADev && !this.isUserAAdmin && !this.isUserAEventMember) && this.module_parameters.group.toLowerCase() === `admin`) return this.logger.info(`${this.data.message.author.tag} trying to use admin only command(${this.data.command}) in #${this.data.message.channel.name}`)
		

		//	Module invoker
		this.cmd = this.module_parameters.start


		// If the channel is restricted to some cmds only; check if cmd has channel enabled
		if ((special_bot_domain.includes(this.data.message.channel.id) && !this.data.commandfile.help.special_channels) ||
			(special_bot_domain.includes(this.data.message.channel.id) && !this.data.commandfile.help.special_channels.includes(this.data.message.channel.id)) || !this.data.commandfile.help.group.toLowerCase() === `admin`) return

		//	Double-check
		if (this.componentsAreReady()) return this.init()

	}


	/**
	 * 	Pulling user author & metadata from database
	 * 	@requestData
	 */
	async requestData() {


		/**
		 * Only pulling the author if user doesn't specify the target.
		 * 
		 * Q: Wait, why pulling the user again? aren't they just the same person?
		 * A: Yes they are, but somehow it returns different structure if we were using
		 * original data from <message.author> that will broke the synchonization between
		 * user. (author/other user)
		 * 
		 * For instance, If you were looking for .displayAvatar() or .username, etc. `message.author` 
		 * can be pulled directly using `author.displayAvatar()` or `author.username`. 
		 * Unfortunately this won't work on returned object from userFinding(),
		 * since they are on different layer. 
		 * 
		 * -------
		 * How to resolve the problem (The possible solution)
		 * -------
		 * 1. Transform the data in User() Class so they are match with how you would expect from `message.author`.
		 * 
		 */
		this.data.meta = await new Data(this.data).pull()
	}


}


module.exports = Commands