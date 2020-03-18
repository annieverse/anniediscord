`use-strict`
const User = require(`./user`)
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

	async requestUserMetadata(dataLevel=1) {
		const fn = `[Commands.requestUserMetadata()]`
		if (!dataLevel) throw new TypeError(`${fn} parameter 'dataLevel' cannot be blank or zero.`)

		if (dataLevel === 2) {
			if (!this.user) this.user = await this._userSelector()
			this.user.meta = await this.userClass.requestMetadata(this.user.id)
			return true
		}

		this.user = await this._userSelector()
		return true
	}

	_userSelector() {
		return this.commandProperties.multiUser && this.args ? this.userClass.lookFor(this.args) : this.userClass.lookFor(this.message.author.id)
	}


}


module.exports = Commands