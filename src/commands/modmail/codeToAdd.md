This code below is the creation statements for the SQLite tables needed.
```javascript
		/**
		 * --------------------------
		 * Modmail Plugin
		 * --------------------------
		 */
		await this._query(`CREATE TABLE IF NOT EXISTS modmail_threads (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT NOT NULL,
			'guild_id' TEXT NOT NULL,
			'thread_id' REAL UNIQUE NOT NULL,
			'status' TEXT NOT NULL,
			'is_anonymous' INTEGER NOT NULL DEFAULT 0,
			'channel' TEXT NOT NULL UNIQUE DEFAULT 0)`
            , `run`
			, []
			, `Verifying table modmail_threads`)
			
		await this._query(`CREATE TABLE IF NOT EXISTS modmail_thread_messages (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT NOT NULL,
			'mod_id' TEXT NOT NULL,
			'guild_id' TEXT NOT NULL,
			'thread_id' TEXT NOT NULL,
			'message' TEXT NOT NULL)`
            , `run`
			, []
			, `Verifying table modmail_thread_messages`)

			
		await this._query(`CREATE TABLE IF NOT EXISTS modmail_blocked_users (
			'registered_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			'user_id' TEXT NOT NULL UNIQUE,
			'blocked' INTEGER DEFAULT 0,
			'reason' TEXT DEFAULT 'The Moderator didnt supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.')`
            , `run`
			, []
			, `Verifying table modmail_blocked_users`)
			
		/**
		 * 
		 * END OF MODMAIL PLUGIN
		 * 
		 */
```

These are the functions needed to interact with the db
```javascript
    /**
	 * MODMAIL Plugin
	 */
    writeToThread(user_id, mod_id, guild_id, thread_id, text){
        this._query(`
			INSERT INTO modmail_thread_messages (registered_at, user_id, mod_id, guild_id, thread_id, message)
			VALUES (datetime('now'), ?, ?, ?, ?, ?)`
			, `run`
			, [user_id, mod_id, guild_id, thread_id, text]
			)
	}

	getBlockedUsers(){
		return this._query(`
				SELECT user_id
				FROM modmail_blocked_users
				WHERE blocked = 1`
				, `all`
				, []
				,`getting blocked users`
			)
	}

	getBlockedUserReason(user_id){
		return this._query(`
				SELECT reason
				FROM modmail_blocked_users
				WHERE user_id = ?`
				, `get`
				, [user_id]
				,`getting blocked user's reason`
			)
	}

	getBlockedUsersList(){
		return this._query(`
			SELECT user_id
			FROM modmail_blocked_users`
			, `all`
			, []
			,`getting blocked users`
		)
	}

	registerUserInBlockList(user_id){
		this._query(`
			INSERT INTO modmail_blocked_users (registered_at, user_id, blocked)
			VALUES (datetime('now'), ?, 0)`
			, `run`
			, [user_id]
			)
	}

	blockUser(user_id, reason = `The Moderator didn't supply a reason, if you would like to appeal this block please address it to the mods on the server or owner.`){
		this._query(`
			UPDATE modmail_blocked_users 
			SET blocked = 1 AND reason = ?
			WHERE user_id = ?`
			, `run`
			, [user_id, reason]
			, `blocking user`
			)
	}

	unblockUser(user_id){
		this._query(`
			UPDATE modmail_blocked_users 
			SET blocked = 0
			WHERE user_id = ?`
			, `run`
			, [user_id]
			)
	}

	isblockedUser(id){
		this._query(`
				SELECT *
				FROM modmail_blocked_users
				WHERE user_id = ?
				AND blocked = 0`
				, `get`
				, [id]
				,`checking if user is blocked`
			)
	}

	async alreadyOpenThread(id, dm = true){
		let search
		if (dm) {
			search = await this._query(`
				SELECT *
				FROM modmail_threads
				WHERE user_id = ?
				AND status = 'open'
				ORDER BY thread_id`
				, `get`
				, [id]
				,`getting open thread`
			)
		} else if (!dm) {
			search = await this._query(`
				SELECT *
				FROM modmail_threads
				WHERE channel = ?
				AND status = 'open'
				ORDER BY thread_id`
				, `get`
				, [id]
				,`getting open thread`
			)
		}
		if (!search) search = `none`
		return search
	}

	updateChannel(id, threadId){
		this._query(`
				UPDATE modmail_threads
				SET channel = ?
				WHERE thread_id = ?`
				, `run`
				, [id, threadId]
			)
	}

	getlogsForUser(userId){
		return this._query(`
			SELECT *
			FROM modmail_threads
			WHERE user_id = ?
			AND status = 'closed' AND is_anonymous = 0
			ORDER BY thread_id`
			, `all`
			, [userId]
			,`getting logs for user`
		)
	}

	closeThread(thread_id){
		this._query(`
		UPDATE modmail_threads SET status = 'closed'
		WHERE thread_id = ?`
		, `run`
		, [thread_id]
		)
	}

	makeNewThread(user_id, guild_id, thread_id, status, is_anonymous){
		try {
			this._query(`
			INSERT INTO modmail_threads (registered_at, user_id, guild_id, thread_id, status, is_anonymous)
			VALUES (datetime('now'), ?, ?, ?, ?, ?)`
			, `run`
			, [user_id, guild_id, thread_id, status, is_anonymous]
			)
		} catch (error) {
			thread_id = makeRandomId()
			this.makeNewThread(user_id, guild_id, thread_id, status, is_anonymous)
		}
		
		function makeRandomId(){
			var result = ``
			var characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`
			var charactersLength = characters.length
			for ( var i = 0; i < 20; i++ ) {
				result += characters.charAt(Math.floor(Math.random() * charactersLength))
			}
			return result
		}
	}

	deleteLog(id) {
		this._query(`
			DELETE FROM modmail_thread_messages
			WHERE thread_id = ?`
			, `run`
			, [id]
			,`delete logs for specific thread`
		)
		this._query(`
			DELETE FROM modmail_threads
			WHERE thread_id = ?`
			, `run`
			, [id]
			,`delete logs for specific thread`
		)
	}

	getLogByThreadId(id){
		return this._query(`
			SELECT *
			FROM modmail_thread_messages
			WHERE thread_id = ?`
			, `all`
			, [id]
			,`getting logs for specific thread`
		)
	}
	
	getThreadTicket(id){
		return this._query(`
			SELECT *
			FROM modmail_threads
			WHERE thread_id = ?`
			, `get`
			, [id]
			,`getting thread data for specific thread`
		)
	}

	/**
	 * 
	 * END OF MODMAIL PLUGIN
	 * 
	 */
```

for commands controller
```javascript
const { readdirSync } = require(`fs`)
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
            if (data.message.content.startsWith(data.bot.prefix)) {
                this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()
            }	
        } else {
            this.commandName = this.messageArray[0].slice(this.prefix.length).toLowerCase()
        }
    }


    /**
     * Running Command Controller. Preparing exceptor on several cases before returning the command file.
     * @returns {CommandClass}
     */
    async run() {
        const fn = `[CommandController.run()] USER_ID:${this.message.author.id}`   
        const initTime = process.hrtime()

        this.commandProperties = this.getCommandProperties(this.commandName)

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

        const cmdUsageData = {
            guild_id: this.message.guild.id,
            user_id: this.message.author.id,
            command_alias: this.commandName,
            resolved_in: cmdFinishTime
        }

        //	Log and store the cmd usage to database.
        this.logger.info(`${fn} ran ${this.commandName} command (${cmdFinishTime})`)
        this.bot.db.recordsCommandUsage(cmdUsageData)
    }

    /**
     * Running Command Controller. Preparing exceptor on several cases before returning the command file.
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
            let allowedCmds = [`ping`, `newThread`, `close`, `anon`, `modlogs`, `showlogs`]
                
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
```

Add in message event
```javascript
    if (this.isModmailMessage) return this._runTask(`MODMAIL`, new Command({bot:this.bot, message:this.message, modmail:true}).runDM(), 5)
    
    /**
     * Check if user sent message from modmail channel
     * @returns {Boolean}
     */
    get isModmailMessage(){
        return this.message.channel.parentID == `507048639747850240`
    }
```