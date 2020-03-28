const Discord = require(`discord.js`)
const {
    VERSION,
    DEV,
    PREFIX,
    PORT,
    PLUGINS,
    PERMISSIONS,
    EXP,
    CURRENCY
} = require(`./config/global`)
const ascii = require(`./config/startupAscii`)
const CommandsLoader = require(`./commands/loader`)
const Database = require(`./libs/database`)
const logger = require(`./libs/logger`)
const Express = require(`express`)
const Locale = require(`./locales/default`)
const getBenchmark = require(`./utils/getBenchmark`)

class Annie extends Discord.Client {
    constructor() {
        super()

        /**
         * The default prop for accessing current Annie's version.
         * @since 6.0.0
         * @type {external:String}
         */
        this.version = VERSION

        /**
         * The default prop for determining if current instance is development environment.
         * @since 6.0.0
         * @type {external:Boolean}
         */
        this.dev = DEV

        /**
         * The default prop for accessing command prefix.
         * @since 6.0.0
         * @type {external:String}
         */
        this.prefix = PREFIX

        /**
         * The default prop for accessing current port.
         * @since 6.0.0
         * @type {external:Number}
         */
        this.port = PORT

        /**
         * The default prop for accessing the available plugins.
         * @since 6.0.0
         * @type {external:Array}
         */
        this.plugins = PLUGINS

        /**
         * The default prop for accessing permissions level.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.permission = PERMISSIONS

        /**
         * The default prop for accessing the default EXP configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.exp = EXP

        /**
         * The default prop for accessing the default Currency configurations.
         * @since 6.0.0
         * @type {external:Object}
         */
        this.currency = CURRENCY

        /**
         * The default prop for accessing languages.
         * @since 6.0.0
         * @type {external:Locales}
         */
        this.locale = Locale

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
        this.supportServer = `[Support Server](https://discord.gg/wSu6Bq)`
    }


    /**
     * Initialize Annie and login to discord
     * @since 6.0.0
     * @param {String} token the bot token
     * @returns {String}
     */
    async prepareLogin(token) {
        try {
            logger.debug(ascii.default)
            this._rejectionHandler()
            await this._initializingDatabase()
            await this._initializingCommands()
            this._listeningToEvents()
            this.login(token)
        }
        catch(e) {
            logger.error(`Client has failed to start > ${e.stack}`)
            process.exit()
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
            return logger.error(`Handle Rejection > ${err.stack}`)
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
        this.db = new Database().connect()
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

}

module.exports = Annie

