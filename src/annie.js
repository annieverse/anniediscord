const Discord = require(`discord.js`)
const customConfig = require(`./config/customConfig.js`)
const config = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./commands/loader`)
const Database = require(`./libs/database`)
const logger = require(`./libs/logger`)
const Express = require(`express`)
const Localizer = require(`./libs/localizer`)
const getBenchmark = require(`./utils/getBenchmark`)
const moment = require(`moment`)
const logSystem = require(`./libs/logs.js`)

class Annie extends Discord.Client {
    constructor() {
        super()
        logger.debug(ascii.default)

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
        this.locale = new Localizer()

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
         * @type {HyperlinkString}
         */ 
        this.supportServer = `https://discord.gg/7nDes9P`

        /**
         * 
         */
        this.logSystem = logSystem
    }


    /**
     * Initialize Annie and login to discord
     * @since 6.0.0
     * @param {String} token the bot token
     * @returns {String}
     */
    async prepareLogin(token) {
        try {
            this._rejectionHandler()
            await this._initializingDatabase()
            await this._initializingCommands()
            this._listeningToEvents()
            this.login(token)
            this.updateConfig()
        }
        catch(e) {
            logger.error(`Client has failed to start > ${e.stack}`)
            process.exit()
        }
    }

    /**
     * updates global config
     * @param {guild} guild uses support server as default
     */
    updateConfig(guild=`577121315480272908`){
        let configClass = new customConfig(this)
        let configtwo = configClass.setConfig(guild)
        this.configClass = configClass
        for (const [prop, value] of Object.entries(configtwo)) {
            if (!this.configs.hasOwnProperty(prop)) {
                this.configs[prop] = value // sets value in tree
                this[prop] = value         // sets global use
            } else {
                this.configs[prop] = value
                this[prop] = value
            }
        }
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
        require(`./controllers/events`)(this)
        if (log) logger.info(`Listening to events`)
    }


    /**
     * Listening to defined port
     * @since 6.0.0
     * @param {Number} port The target port. Default 0.
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     */
    _listeningToPort(port=0, log=true) {
        const app = Express()
        app.get(`/`, (request, response) => response.sendStatus(200))
        app.listen(port)
        if (!log) return
        logger.info(`Listening to port ${port}`)
    }
  

    /**
     * Handles promise rejection
     * @since 6.0.0
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     * @returns {WinstonLogging}
     */
    _rejectionHandler(log=true) {
        process.on(`unhandledRejection`, err => {
            if (!log) return
            return logger.error(err.stack)
        })
    }


    /**
     * Initialize and connect the database
     * @since 6.0.0
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     * @returns {WinstonLogging}
     */
    async _initializingDatabase(log=true) {
        const initTime = process.hrtime()
        this.db = await new Database().connect()
        if (!log) return
        return logger.info(`Database has successfully connected (${getBenchmark(initTime)})`)
    }


    /**
     * Initialize and register all the available commands
     * @since 6.0.0
     * @param {Boolean} [log=true] set false to disable the logging. Otherwise, true is the default.
     * @returns {WinstonLogging}
     */
    async _initializingCommands(log=true) {
        const initTime = process.hrtime()
        const res = await new CommandsLoader().default()
        this.commands = res
        if (!log) return
        return logger.info(`${res.totalFiles} Commands has successfully registered (${getBenchmark(initTime)})`)
    }


    /**
     *  Check if user's action still in cooling-down state.
     *  @since 6.0.0
     *  @param {string} [label=``] Define label for the cooldown. (Example: MSG_{USER.ID})
     *  @returns {boolean}
     */
    async isCooldown(label=``) {
        const fn = `[Annie.isCooldown()]`
        if (this.plugins.includes(`DISABLE_COOLDOWN`)) return false
        logger.debug(`${fn} checking ${label}`)
        const res = await this.db.redis.get(label)
        if (res) logger.debug(`${fn} blocking access for ${label}. Key was registered at ${res}.`)
        return res
    }


    /**
     *  Set a cooldown for user
     *  @since 6.0.0
     *  @param {string} [label=``] Define label for the cooldown. (Example: MSG_{USER.ID})
     *  @param {number} [time=0] timeout in seconds
     *  @returns {boolean}
     */
    async setCooldown(label=``, time=0) {
        const fn = `[Annie.setCooldown()]`
        if (time <= 0) logger.error(`${fn} "time" parameter must above 0.`)
        logger.debug(`${fn} registering ${label} with ${time}s timeout`)
        return await this.db.redis.set(label, moment().format(), `EX`, time)
    }

}

module.exports = Annie

