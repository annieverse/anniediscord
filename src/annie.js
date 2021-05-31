const Discord = require(`discord.js`)
const customConfig = require(`./config/customConfig.js`)
const config = require(`./config/global`)
const CommandsLoader = require(`./commands/loader`)
const Database = require(`./libs/database`)
const logger = require(`./libs/logger`)
const Express = require(`express`)
const Localizer = require(`./libs/localizer`)
const getBenchmark = require(`./utils/getBenchmark`)
const moment = require(`moment`)
const LogSystem = require(`./libs/logs`)
const Reminder = require(`./libs/reminder`)
const PointsController = require(`./controllers/points`)
const Experience = require(`./libs/exp`)
const emoji = require(`./utils/emojiFetch`)
const loadAsset = require(`./utils/loadAsset`)
const fetch = require(`node-fetch`)

class Annie extends Discord.Client {
    constructor() {
        super()

        /**
         * The default prop for accessing the global point configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.configs = config

        /**
         * The default prop for accessing current Annie's version.
         * @since 6.0.0
         * @type {external:String}
         */
        this.version = config.version

        /**
         * The default prop for determining if current instance is development environment.
         * @since 6.0.0
         * @type {external:Boolean}
         */
        this.dev = config.dev

        /**
         * The default prop for accessing command prefix.
         * @since 6.0.0
         * @type {external:String}
         */
        this.prefix = config.prefix

        /**
         * The default prop for accessing current port.
         * @since 6.0.0
         * @type {external:Number}
         */
        this.port = config.port

        /**
         * The default prop for accessing the available plugins.
         * @since 6.0.0
         * @type {external:Array}
         */
        this.plugins = config.plugins

        /**
         * The default prop for accessing permissions level.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.permission = config.permissions

        /**
         * The default prop for accessing the global point configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.points = config.points

        /**
         * The default prop for accessing the default EXP configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.exp = config.points.exp

        /**
         * The default prop for accessing the default Currency configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.currency = config.points.currency

        /**
         * The default prop for accessing languages.
         * @since 6.0.0
         * @type {external:Locales}
         */
        this.locale = new Localizer().registerLocales()

        /**
         * Points Manager.
         * @param {object} [message={}] Target message instance.
         * @return {external:PointManager}
         */
        this.pointsController = (message={}) => new PointsController({bot:this, message:message})

        /**
         * Experience Framework
         * @param {GuildMember} user Target member.
         * @param {Guild} guild Target guild for the member.
         * @param {TextChannel} channel Target level-up message channel.
         * @return {external:Experience}
         */
        this.experienceLibs = (user, guild, channel) => new Experience(this, user, guild, channel)

        /**
         * The default function for calculating task performance in milliseconds.
         * @since 6.0.0
         * @type {SecretKey}
         */
        this.getBenchmark = getBenchmark

        /**
         * The default function for handling logging tasks.
         * @type {WinstonObject}
         */
        this.logger = logger

        /**
         * Stores Annie's Support Server invite link.
         * @type {string}
         */ 
        this.supportServer = `https://discord.gg/7nDes9P`

        /**
         * Manages external logging system.
         * @type {external:Object}
         */ 
        this.logSystem = LogSystem

        /**
         * User cooldown pool.
         * @type {collection}
         */
        this.cooldowns = new Discord.Collection()

        /**
         * State checker on startup.
         * @type {boolean}
         */
        this.startupState = true
        this.prepareLogin()
    }


    /**
     * Initialize Annie and login to discord
     * @since 6.0.0
     * @returns {void}
     */
    prepareLogin() {
    process.on(`unhandledRejection`, err => logger.warn(`Catched rejection > ${err.stack}`))
        try {
            this._initializingDatabase()
            this._initializingCommands()
            this._listeningToEvents()
            this.login(process.env.TOKEN)
        }
        catch(e) {
            logger.error(`Client has failed to start > ${e.stack}`)
            process.exit()
        }
    }

    /**
     * Registering configuration nodes for each guild or single guild by specifying it in the parameter.
     * @param {string} [guildId=null] Specify target guild id for single guild register.
     * @author klerikdust
     * @return {void}
     */
    async registerGuildConfigurations(guildId=null) {
        const initTime = process.hrtime()
        const registeredGuildConfigurations = await this.db.getAllGuildsConfigurations()
        //  If prompted to register only single guild, then use single-element array.
        const getGuilds = guildId ? [guildId] : this.guilds.cache.map(guild => guild.id)
        for (let i=0; i<getGuilds.length; i++) {
            let guild = this.guilds.cache.get(getGuilds[i])
            let existingGuildConfigs = registeredGuildConfigurations.filter(node => node.guild_id === guild.id)
            guild.configs = new Map()
            //  Iterating over all the available configurations
            for (let x=0; x<customConfig.availableConfigurations.length; x++) {
                let cfg = customConfig.availableConfigurations[x]
                //  Register existing configs into guild's nodes if available
                if (existingGuildConfigs.length > 0) {
                    const matchConfigCode = existingGuildConfigs.filter(node => node.config_code.toUpperCase() === cfg.name)[0]
                    if (matchConfigCode) {
                        cfg.value = this._parseConfigurationBasedOnType(matchConfigCode.customized_parameter, cfg.allowedTypes)
                        cfg.setByUserId = matchConfigCode.set_by_user_id
                        cfg.registeredAt = matchConfigCode.registered_at
                        cfg.updatedAt = matchConfigCode.updated_at
                    }
                }
                guild.configs.set(cfg.name, cfg)
            }
        } 
        this.logger.info(`[SHARD_ID:${this.shard.ids[0]}@GUILD_CONF] confs from ${getGuilds.length} guilds have been registered (${getBenchmark(initTime)})`)
    }

    /**
     * Registering guild's registere ARs into cache.
     * @return {void}
     */
    async registerGuildAutoResponders() {
        const fn = `[SHARD_ID:${this.shard.ids[0]}@AUTO_RESPONDER]`
        const ars = await this.db.getGuildsWithAutoResponders()
        let totalArs = 0
        for (let i=0; i<ars.length; i++) {
            const guildId = ars[i].guild_id
            //  Skip if guild is not present in the current shard 
            if (!this.guilds.cache.has(guildId)) continue
            const registeredArs = await this.db.getAutoResponders(guildId, false)
            totalArs += registeredArs.length
            this.db.setCache(`REGISTERED_AR@${guildId}`, JSON.stringify(registeredArs))
        }
        this.logger.info(`${fn} ${totalArs} ARs have been registered`)
    }

    /**
     * Parsing configuration value into a proper type based on what's already defined in customConfigs.json
     * @param {*} [config=``] the target config to be checked its type
     * @param {array} [typePool=[]] list of allowed types for the config
     * @since 7.3.3
     * @author klerikdust
     * @private
     * @returns {*}
     */
    _parseConfigurationBasedOnType(config=``, typePool=[]) {
        if (typePool.includes(`array`) || typePool.includes(`object`)) return JSON.parse(config)
        else if (typePool.includes(`number`) || typePool.includes(`boolean`)) return parseInt(config)
        else if (typePool.includes(`float`) || typePool.includes(`real`)) return parseFloat(config)
        else if (typePool.includes(`string`)) return config
        else {
            logger.warn(`[Annie._parseConfigsBasedOnType()] failed to parse the allowed types for "${config}" and now it will return as its original value.`)
            return config
        }
    }

    /**
     * Registering saved reminders into cron
     * @return {void}
     */
    registerReminders() {
        this.reminders = new Reminder(this)
    }

    /**
     * Recommended method to use when trying to shutdown Annie.
     * @since 6.0.0
     * @returns {ProcessExit}
     */
    terminate() {
        this.db.client.close()
        this.destroy()
        logger.info(`Client.terminate() has successfully terminating the system.`)
        process.exit()
    }

    /**
     * Registering new first-level property/node into this.
     * @since 6.0.0
     * @param {*} [node] assign any value.
     * @param {string} [nodeName] codename/identifier of the given node.
     * @returns {void}
     */
    registerNode(node, nodeName) {
        const fn = `[Annie.registerNode()]`
        if (!nodeName || !node) throw new TypeError(`${fn} parameters (node, nodeName) cannot be blank.`)
        if (typeof nodeName != `string`) throw new TypeError(`${fn} parameter 'nodeName' only accepts string.`)
        this[nodeName] = node
    }


    /**
     * Listening to predefined events.
     * @since 6.0.0
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     */
    _listeningToEvents(log=true) {
        const initTime = process.hrtime()
        require(`./controllers/events`)(this)
        if (log) logger.info(`[SHARD_ID:${this.shard.ids[0]}@EVENT_INIT] events loaded (${getBenchmark(initTime)})`)
    }


    /**
     * Listening to defined port
     * @since 6.0.0
     * @param {Number} port The target port. Default 0.
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     */
    _listeningToPort(port=0, log=true) {
        const initTime = process.hrtime()
        const app = Express()
        app.listen(3000)
        app.get(`/`, (request, response) => response.sendStatus(200))
        if (!log) return
        logger.info(`[SHARD_ID:${this.shard.ids[0]}@PORT_INIT] using port ${port} (${getBenchmark(initTime)})`)
    }

    /**
     * Initialize and connect the database
     * @since 6.0.0
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     * @returns {WinstonLogging}
     */
    _initializingDatabase(log=true) {
        const initTime = process.hrtime()
        this.db = new Database().connect()
        if (!log) return
        return logger.info(`[SHARD_ID:${this.shard.ids[0]}@DATABASE_INIT] db manager loaded (${getBenchmark(initTime)})`)
    }


    /**
     * Initialize and register all the available commands
     * @since 6.0.0
     * @returns {WinstonLogging}
     */
    _initializingCommands() {
        const initTime = process.hrtime()
        const res = new CommandsLoader().execute()
        this.commands = res
        return logger.info(`[SHARD_ID:${this.shard.ids[0]}@COMMANDS_INIT] ${res.totalFiles} commands loaded (${getBenchmark(initTime)})`)
    }


    /**
     *  Check if user's action still in cooling-down state.
     *  @since 6.0.0
     *  @param {string} [label=``] Define label for the cooldown. (Example: MSG_{USER.ID})
     *  @returns {boolean}
     */
    isCooldown(label=``) {
        return this.db.redis.get(label)
    }


    /**
     *  Set a cooldown for user
     *  @since 6.0.0
     *  @param {string} [label=``] Define label for the cooldown. (Example: MSG_{USER.ID})
     *  @param {number} [time=0] timeout in seconds
     *  @returns {void}
     */
    setCooldown(label=``, time=0) {
        this.db.redis.set(label, moment().format(), `EX`, time)
    }

    /**
     *  An Emoji finder. Fetch all the available emoji based on given emoji name
     *  @param {string} [keyword=``] emoji keyword to search
     *  @return {Emoji|null}
     */
    getEmoji(keyword=``) {
        return emoji(keyword, this)
    }

    /**
     * Parse target's username. If not available, fall back to parameter.
     * @param {string} [userId=``] Target user id
     * @return {string}
     */
    async getUsername(userId=``) {
        const user = await this.users.fetch(userId)
        return user ? user.username : userId
    }

    /**
	*	Handles user's avatar fetching process. Set `true` on
	*   second param to return as compressed buffer. (which is needed by canvas)
	*	@param {String|ID} id id of user to be fetched from.
	*	@param {Boolean} compress set true to return as compressed buffer.
    *	@param {string} [size=`?size=512`] Custom size.
	*   @param {boolean} [dynamic=false]
	*   @return {buffer}
	*/
    async getUserAvatar(id, compress = false, size = `?size=512`, dynamic=false) {
        const user = await this.users.fetch(id) 
        if (!user) return loadAsset(`error`)
		let url = user.displayAvatarURL({format: `png`, dynamic: dynamic})
        if (compress) {
            return fetch(url.replace(/\?size=2048$/g, size),{method:`GET`})
                .then(data => data.buffer())
        }
        return url + size
    }

    /**
     * Assign user's permission level to <Message> properties.
     * Accessable through <message.author.permissions> afterwards.
     * @param {object} [messageInstance={}] Target message instance to be parsed from.
     * @return {object}
     */
    getUserPermission(messageInstance={}) {
        return this.permissionManager.getUserPermission(messageInstance)
     }

    /**
     *  Fetching guild's configurations.
     *  @param {string} [id=``] Target guild id.
     *  @return {map|null}
     */
    fetchGuildConfigs(id=``) {
        return this.guilds.cache.get(id).configs
    }
}

module.exports = new Annie()

