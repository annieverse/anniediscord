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
         * The accepted alias to cancel command flow.
         * @type {array}
         */	
		this.cancelParameters = [
			`n`,
			`no`,
			`cancel`,
			`exit`
		]

		/**
		 * Fetched Command Properties
		 * @since 6.0.0
		 * @type {Object}
		 */
		this.commandProperties = Stacks.commandProperties
		
		/**
		 * Define the current instance identifier
		 * @since 6.0.0
		 * @type {stirng}
		 */
		this.instanceId = `${this.commandProperties.name.toUpperCase()}_${this.message.author.id}`
	
		/**
         * User lib
         * @since 6.0.0
         * @type {UserClass}
         */	
		this.userClass = new User(Stacks.bot, Stacks.message)

		/**
         * The default locale for current command instance
         * @type {string}
         */	
		this.locale = Stacks.bot.locale[`en`]	
		this.logger = Stacks.bot.logger
	
	}

	/**
	 *  first-level collector handler. Inherited from `Pistachio.collector()`
	 *  @param {number} [max=2] define the maximum accepted responses
	 *  @param {number} [timeout=120000] 120 seconds timeout
	 *  @returns {MessageCollector}
	 */
	setSequence(max=2, timeout=120000) {
		const fn = `[Commands.setSequence()]`
		this.logger.debug(`${fn} ${this.instanceId} initializing new sequence flow`)
		this.onSequence = 1
		this.sequence = this.message.channel.createMessageCollector(
		m => m.author.id === this.message.author.id, {
			max: max,
			time: timeout,
		})
	}

	/**
	 * Moving sequence forward
	 * @returns {void}
	 */
	nextSequence() {
		const fn = `[Command.nextSequence()]`
		if (!this.onSequence) {
			this.onSequence = 1
			this.logger.debug(`${fn} ${this.instanceId} no sequence found. Automatically set to ${this.onSequence}`)
			return
		}
		const newSequence = this.onSequence + 1
		this.logger.debug(`${fn} ${this.instanceId} moving up from ${this.onSequence} to ${newSequence}`)
		this.onSequence = newSequence
	}

	/**
	 * Nullify/end current sequence
	 * @returns {boolean}
	 */
	endSequence() {
		const fn = `[Command.endSequence()]`
		this.onSequence = null
		this.sequence.stop()
		this.logger.debug(`${fn} ${this.instanceId} has finished`)
		return true
	}

	async requestUserMetadata(dataLevel=1) {
		const fn = `[Commands.requestUserMetadata()]`
		if (!dataLevel) throw new TypeError(`${fn} parameter 'dataLevel' cannot be blank or zero.`)
		const targetUser = this._userSelector()
		if (!targetUser) {
			this.user = null
			return false
		}
		const result = await this.userClass.requestMetadata(targetUser.id, dataLevel)
		this.user = result
		if (result.lang) this.locale = this.bot.locale[result.lang]
		return true
	}

	async requestAuthorMetadata(dataLevel=1) { 
		const fn = `[Commands.requestAuthorMetadata()]`
		if (!dataLevel) throw new TypeError(`${fn} parameter 'dataLevel' cannot be blank or zero.`)
		const result = await this.userClass.requestMetadata(this.message.author.id, dataLevel)
		this.author = result
		if (result.lang) this.locale = this.bot.locale[result.lang]
		return true
	}

	_userSelector() {
		return this.commandProperties.multiUser && this.fullArgs ? this.userClass.lookFor(this.fullArgs) : this.userClass.lookFor(this.message.author.id)
	}


}


module.exports = Commands