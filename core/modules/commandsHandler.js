`use-strict`

const Controller = require(`../utils/MessageController`)
const Data = require(`../utils/userdataSelector`)
const User = require(`../utils/userSelector`)
const Pistachio = require(`../utils/Pistachio`)
const env = require(`../../.data/environment`)
const { special_bot_domain } = require(`./config`)


/**
  * Commands Handler
  * @param {Object} data preferably follow the structure in `stacks` variable (./events/message.js)
  */ 
class CommandsHandler extends Controller {
	constructor(data) {
		super(data)

		this.data.cmdExecTime = process.hrtime()

		/**
		 * 	Command-related properties will be stored inside <data>, not in root object <this>.
		 * 	Sounds inconsistent, but in order to avoid errors in command modules.
		 */
		//	Get command prefix
		this.data.prefix = env.prefix

		//	Tokenize message
		this.data.messageArray = data.message.content.split(` `)

		//	Get which command is being used
		this.data.cmd = this.data.messageArray[0].toLowerCase()

		//	Get user command parameter <Tokenized>
		this.data.args = this.data.messageArray.slice(1)

		//	Get user command parameter <FullWords>
		this.data.fullArgs = this.data.args.join(` `)

		//	Removing the prefix, now only the command name
		this.data.command = this.data.cmd.slice(this.data.prefix.length)

		//	Get command file from bot registry
		this.data.commandfile = data.bot.commands.get(this.data.cmd.slice(this.data.prefix.length)) 
		|| data.bot.commands.get(data.bot.aliases.get(this.data.cmd.slice(this.data.prefix.length)))

		//	Get file name
		this.filename = this.data.commandfile ? this.data.commandfile.help.name : null

		//	Benchmark label
		this.data.benchmarkLabel = this.data.fullArgs ? this.data.fullArgs : this.data.meta.author.username

		// reference to object
		this.self = this
	
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
		if (!this.data.commandfile) return this.logger.error(`${this.data.message.author.tag} trying to use invalid command (${this.data.command}) in #${this.data.message.channel.name}`)


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

		if (!this.isUserADev && this.module_parameters.group.toLowerCase() === (`developer`||`dev`)) return this.logger.info(`${this.data.message.author.tag} trying to use dev only command(${this.data.command}) in #${this.data.message.channel.name}`)

		if ((!this.isUserADev && !this.isUserAAdmin && !this.isUserAEventMember) && this.module_parameters.group.toLowerCase() === `admin`) return this.logger.info(`${this.data.message.author.tag} trying to use admin only command(${this.data.command}) in #${this.data.message.channel.name}`)
		
		//	Module invoker
		this.cmd = this.module_parameters.start


		// If the channel is restricted to some cmds only; check if cmd has channel enabled
		if ((special_bot_domain.includes(this.data.message.channel.id) && !this.data.commandfile.help.special_channels) ||
		(special_bot_domain.includes(this.data.message.channel.id) && !this.data.commandfile.help.special_channels.includes(this.data.message.channel.id))) return

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
        if (!this.data.fullArgs) {
            this.data.meta.author = await new User(this.data).get()
            return
        }
		//	Proceed to both data pulling
		this.data.meta = await new Data(this.data).pull()
	}


	/**
	 * 	Running the command
	 * 	@init
	 */
	async init() {
		try {
			await this.requestData()

			if (this.data.meta.author == null) return this.logger.error(`[${this.message.channel.name}] ${this.data.message.author.tag} has failed to run ${this.filename}. > Target user is not \nregistered in DB`)

			//	Set default id for db access
			this.bot.db = this.bot.db.setUser(this.data.meta.author.id)
			const { bot, message, command, args, fullArgs, commandfile, meta } = this.data
			const Pistachified = new Pistachio({bot, message, command, args, fullArgs, commandfile, meta}).bag()

			await new this.cmd(Pistachified).execute()
			
			const cmdFinishTime = this.getBenchmark(process.hrtime(this.data.cmdExecTime))
			const cmdUsageData = {
				guild_id: this.data.message.guild.id,
				user_id: this.data.message.author.id,
				command_alias: command,
				resolved_in: cmdFinishTime
			}
		
			//	Log and store the cmd usage to database.
			this.logger.info(`[${this.message.channel.name}] ${this.data.message.author.tag}: ran ${command} in (${cmdFinishTime})`)
			this.bot.db.recordsCommandUsage(cmdUsageData)
			
		}
		catch (e) {
			this.logger.error(`[${this.message.channel.name}] ${this.data.message.author.tag} has failed to run ${this.filename}. > ${e.stack}`)
		}
	}


}


module.exports = CommandsHandler