`use-strict`

const User = require(`./user`)
const Pistachio = require(`./pistachio`)


/**
 * Master/Parent module of Command Cluster
 * Not callable unless extended from a sub-command.
 */ 
class Commands {
	constructor(Stacks) {
		this.bot = Stacks.bot
		this.message = Stacks.message

        /**
         * The default prop for accessing command's prefix.
         * @since 1.0.0
         * @type {String}
         */
		this.prefix = Stacks.bot.prefix

        /**
         * Tokenized message into an array.
         * @since 1.0.0
         * @type {Array}
         */
		this.messageArray = Stacks.message.content.split(` `)

		/**
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
         * The used command name.
         * @since 1.0.0
         * @type {String}
         */	
		this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()

		/**
		 * Fetched Command Properties
		 * @since 6.0.0
		 * @type {Object}
		 */
		this.commandProperties = Stacks.commandProperties
		
		/**
         * User lib
         * @since 6.0.0
         * @type {UserClass}
         */	
		this.userClass = new User(Stacks.bot, Stacks.message)
		this.logger = Stacks.bot.logger
	
	}

	async prepare() {
		this._userSelector()
		await this._requestUserMetadata()
		await this._requestPistachios()
	}

	async _requestPistachios() {
		const components = {
			bot: this.bot,
			message: this.message,
			prefix: this.prefix,
			commandName: this.commandName,
			args: this.args,
			fullArgs: this.fullArgs
		}
		this.utils = new Pistachio(components)
		return true
	}

	async _requestUserMetadata() {
		this.user.meta = await this.userClass.requestMetadata(this.user.id)
		return true
	}

	_userSelector() {
		this.user = this.commandProperties.multiUser && this.args ? this.userClass.lookFor(this.args) : this.userClass.lookFor(this.message.author.id)
		return true
	}


}


module.exports = Commands