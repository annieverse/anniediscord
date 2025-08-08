"use strict"
const Discord = require(`discord.js`)
const customConfig = require(`./config/customConfig.js`)
const config = require(`./config/global`)
const commandsLoader = require(`./commands/loader`)
const Database = require(`./libs/database`)
const { Localization } = require(`./libs/localizer`)
const getBenchmark = require(`./utils/getBenchmark`)
const PointsController = require(`./controllers/points`)
const Experience = require(`./libs/exp`)
const emoji = require(`./utils/emojiFetch`)
const loadAsset = require(`./utils/loadAsset`)
const superagent = require(`superagent`)
const shardName = require(`./config/shardName`)
const Response = require(`./libs/response`)
const CronManager = require(`cron-job-manager`)
const { shardLogger } = require(`../pino.config.js`)
const errorRelay = require(`../src/utils/errorHandler.js`)

class Annie extends Discord.Client {
    constructor (intents) {
        super({
            intents: intents, presence: { status: `idle`, activities: [{ name: `Shard preparing ...`, type: Discord.ActivityType.Watching }] }, makeCache: Discord.Options.cacheWithLimits({
                PresenceManager: 0,
                GuildBanManager: 0,
                GuildInviteManager: 0,
                GuildScheduledEventManager: 0,
                GuildStickerManager: 0,
                VoiceStateManager: 0,
                StageInstanceManager: 0,
                MessageManager: Discord.Options.createDefault(),
                BaseGuildEmojiManager: Discord.Options.createDefault(),
                GuildEmojiManager: Discord.Options.createDefault(),
                ReactionManager: Discord.Options.createDefault(),
                ReactionUserManager: Discord.Options.createDefault(),
                ApplicationCommandManager: Discord.Options.createDefault(),
                ThreadMemberManager: Discord.Options.createDefault(),
                GuildMemberManager: Discord.Options.createDefault(),
                UserManager: Discord.Options.createDefault(),
                ThreadManager: Discord.Options.createDefault(),
                /**
                 * The following managers are not supported
                 * GuildManager, ChannelManager, GuildChannelManager, RoleManager, and PermissionOverwriteManager
                 */
            })
        })
        this.startupInit = process.hrtime()

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
         * Points Manager.
         * @param {object} [message={}] Target message instance.
         * @return {external:PointManager}
         */
        this.pointsController = (message = {}) => new PointsController({ bot: this, message: message })

        /**
         * Experience Framework
         * @param {GuildMember} user Target member.
         * @param {Guild} guild Target guild for the member.
         * @param {TextChannel} channel Target level-up message channel.
         * @return {external:Experience}
         */
        this.experienceLibs = (user, guild, channel, locale) => new Experience(this, user, guild, channel, locale)

        this.localization = new Localization()

        /**
         * Response/Message Wrapper.
         * @param {Message} message Resolvable message instance
         * @param {boolean} [channelAsInstance=false] Toggle `true` when supplied
         * @param {object} [localeMetadata=null] For Logging purpose
         * @return {external:Response}
         */
        this.responseLibs = (message, channelAsInstance = false, localeMetadata = this.localization.findLocale) => new Response(message, channelAsInstance, localeMetadata)

        /**
         * The default function for calculating task performance in milliseconds.
         * @since 6.0.0
         * @type {SecretKey}
         */
        this.getBenchmark = getBenchmark

        /**
         * Current shard id.
         * @type {number}
         */
        this.shardId = this.shard.ids[0]

        /**
         * The default function for handling logging tasks.
         * @type {Pino}
         */
        this.logger = shardLogger(`SHARD_ID:${this.shardId}/${shardName[this.shardId]}`)

        /**
         * Stores Annie's Support Server invite link.
         * @type {string}
         */
        this.supportServer = `https://discord.gg/HjPHCyG346`

        /**
         * The guild id for support server.
         * @type {string}
         */
        this.supportServerId = `577121315480272908`

        /**
         * User cooldown pool.
         * @type {collection}
         */
        this.cooldowns = new Discord.Collection()

        /**
         * Cron instance
         * @type {object}
         */
        this.cronManager = new CronManager()
        this.prepareLogin()
    }


    /**
     * Initialize Annie and login to discord
     * @since 6.0.0
     * @returns {void}
     */
    prepareLogin() {
        process.on(`unhandledRejection`, err => {
            this.logger.warn(`unhandledRejection > ${err}`)
            this.logger.error(err)
            if (!this.isReady()) return

            const errorMsg = err.message || `Unknown Error`
            const errorStack = err.stack || `Unknown Error Stack`
            errorRelay(this, { fileName: `annie.js`, errorType: `normal`, error_message: errorMsg, error_stack: errorStack }).catch(error => this.logger.error(error))
        })

        try {
            this.registerNode(new Database().connect(), `db`)
            const { MESSAGE_COMMANDS, APPLICATION_COMMANDS, GUILDONLY_COMMANDS } = commandsLoader({ logger: this.logger })
            this.registerNode(MESSAGE_COMMANDS, `message_commands`)
            this.registerNode(APPLICATION_COMMANDS, `application_commands`)
            this.registerNode(GUILDONLY_COMMANDS, `guildonly_commands`)
            require(`./controllers/events`)(this)
            this.login(process.env.BOT_TOKEN)
        } catch (e) {
            this.logger.error(`Client has failed to start > ${e.stack}`)
            process.exit()
        }
    }

    /**
     * Registering configuration nodes for each guild or single guild by specifying it in the parameter.
     * @param {string} [guildId=null] Specify target guild id for single guild register.
     * @author klerikdust
     * @return {void}
     */
    async registerGuildConfigurations(guildId = null) {
        const initTime = process.hrtime()
        const getGuilds = guildId ? [guildId] : this.guilds.cache.map(guild => guild.id)
        const registeredGuildConfigurations = await this.db.guildUtils.getAllGuildsConfigurations(getGuilds)
        //  If prompted to register only single guild, then use single-element array.
        for (let i = 0; i < getGuilds.length; i++) {
            let guild = this.guilds.cache.get(getGuilds[i])
            let existingGuildConfigs = registeredGuildConfigurations.filter(node => node.guild_id === guild.id)
            guild.configs = new Map()
            //  Iterating over all the available configurations
            for (let x = 0; x < customConfig.availableConfigurations.length; x++) {
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
     * Registering cache and cron for saved user durational buffs.
     * @return {void}
     */
    async registerUserDurationalBuffs() {
        this.db.durationalBuffs.getSavedDurationalBuffs().then(async src => {
            if (!src.length) return
            let count = 0
            for (let i = 0; i < src.length; i++) {
                const node = src[i]
                //  Skip if guild isn't exists in current shard.
                if (!this.guilds.cache.has(node.guild_id)) continue
                const key = `${node.type}_BUFF:${node.guild_id}@${node.user_id}`
                const localTime = await this.db.systemUtils.toLocaltime(node.registered_at)
                const expireAt = new Date(localTime).getTime() + node.duration
                //  Skip expired buff, and delete it from database as well.
                if ((new Date(expireAt).getTime() - Date.now()) <= 0) {
                    this.db.durationalBuffs.getUserDurationalBuffId(node.type, node.name, node.multiplier, node.user_id, node.guild_id)
                        .then(id => {
                            this.db.durationalBuffs.removeUserDurationalBuff(id)
                        })
                    continue
                }
                this.db.redis.sAdd(key, `${node.multiplier}`)
                this.cronManager.add(node.multiplier + `_` + key, new Date(expireAt), () => {
                    //  Flush from cache and sqlite
                    this.db.redis.srem(key, `${node.multiplier}`)
                    this.db.durationalBuffs.getUserDurationalBuffId(node.type, node.name, node.multiplier, node.user_id, node.guild_id)
                        .then(id => {
                            this.db.durationalBuffs.removeUserDurationalBuff(id)
                        })
                    //  Send expiration notice
                    this.users.fetch(node.user_id)
                        .then(async user => {
                            this.responseLibs(user).send(`Your **'${node.name}'** buff has expired! ${await this.getEmoji(`AnnieHeartPeek`)}`, {
                                field: user,
                                footer: `${this.guilds.cache.get(node.guild_id).name}'s System Notification`
                            })
                                .catch(e => e)
                        })
                        .catch(e => e)
                }, { start: true })
                count++
            }
            this.logger.info(`[SHARD_ID:${this.shard.ids[0]}@USER_DURATIONAL_BUFFS] ${count} buffs have been registered`)
        })
    }

    /**
     * Registering guild's registere ARs into cache.
     * @return {void}
     */
    async registerGuildAutoResponders() {
        const fn = `[SHARD_ID:${this.shard.ids[0]}@AUTO_RESPONDER]`
        const ars = await this.db.autoResponder.getGuildsWithAutoResponders()
        let totalArs = 0
        for (let i = 0; i < ars.length; i++) {
            const guildId = ars[i].guild_id
            //  Skip if guild is not present in the current shard 
            if (!this.guilds.cache.has(guildId)) continue
            const registeredArs = await this.db.autoResponder.getAutoResponders(guildId, false)
            totalArs += registeredArs.length
            this.db.databaseUtils.setCache(`REGISTERED_AR@${guildId}`, JSON.stringify(registeredArs))
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
    _parseConfigurationBasedOnType(config = ``, typePool = []) {
        if (typePool.includes(`array`) || typePool.includes(`object`)) return JSON.parse(config)
        else if (typePool.includes(`number`) || typePool.includes(`boolean`)) return parseInt(config)
        else if (typePool.includes(`float`) || typePool.includes(`real`)) return parseFloat(config)
        else if (typePool.includes(`string`)) return config
        else {
            this.logger.warn(`[Annie._parseConfigsBasedOnType()] failed to parse the allowed types for "${config}" and now it will return as its original value.`)
            return config
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
        this.logger.info(`Has successfully terminated the system`)
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
        const fn = `[CLIENT@REGISTER_NODE]`
        if (!nodeName || !node) throw new TypeError(`${fn} parameters (node, nodeName) cannot be blank.`)
        if (typeof nodeName != `string`) throw new TypeError(`${fn} parameter 'nodeName' only accepts string.`)
        this[nodeName] = node
        this.logger.info(`${fn} '${nodeName}' has been registered as client's property.`)
    }

    /**
     * Fetch target guild's log channel by using several assumptions.
     * @param {string} guildId
     * @return {object|null}
     */
    getGuildLogChannel(guildId) {
        if (!guildId) throw new TypeError(`[GET_GUILD_LOG_CHANNEL] param 'guildId' must be a valid string`)
        if (!this.guilds.cache.has(guildId)) throw new RangeError(`[GET_GUILD_LOG_CHANNEL] target guild '${guildId}' doesn't exists in cache`)
        const guild = this.guilds.cache.get(guildId)
        //  Check for saved custom log
        const customLogChannel = guild.configs.get(`LOGS_CHANNEL`)
        if (customLogChannel.value) {
            if (guild.channels.cache.has(customLogChannel.value)) return guild.channels.cache.get(customLogChannel.value)
        }
        //  Check by assumptions
        const assumptionLogChannel = guild.channels.cache.find(node => {
            return (node.name.toLowerCase() === `logs`) || (node.name.toLowerCase() === `log`)
        })
        if (assumptionLogChannel) return assumptionLogChannel
        //  Both assumption and saved custom channel don't work, fallback as null 
        return null
    }
    /**
     *  An Emoji finder. Fetch all the available emoji based on given emoji name
     *  @param {string} [keyword=``] emoji keyword to search
     *  @param {boolean} [serverId=``] What server the emoji belongs to
     *  @return {Emoji|null}
     */
    getEmoji(keyword = ``, serverId = ``) {
        return emoji(keyword, this, serverId)
    }

    /**
     * Parse target's username. If not available, fall back to parameter.
     * @param {string} [userId=``] Target user id
     * @return {string}
     */
    async getUsername(userId = ``) {
        try {
            const user = await this.users.fetch(userId)
            return user ? user.username : userId
        }
        catch (e) {
            return userId
        }
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
    async getUserAvatar(id, guildId, compress = false, size = `?size=512`, forceStatic = true) {
        let guild, guildMember
        !this.guilds.cache.has(guildId) ? guild = await this.guilds.fetch(guildId) : guild = await this.guilds.cache.get(guildId)
        !guild.members.cache.has(this.users.cache.get(id)) ? guildMember = await guild.members.fetch(id) : await guild.members.cache.get(id)

        // const user = await this.guilds.cache.get(id).members.get(id)
        if (!guildMember) return loadAsset(`error`)
        let url = guildMember.displayAvatarURL({ extension: `png`, forceStatic: forceStatic })
        if (compress) {
            return superagent.get(url.replace(/\?size=2048$/g, size))
                .then(res => res.body)
        }
        return url + size
    }

    /**
     * Assign user's permission level to <Message> properties.
     * Accessable through <message.author.permissions> afterwards.
     * @param {object} [messageInstance={}] Target message instance to be parsed from.
     * @return {object}
     */
    getUserPermission(messageInstance = {}) {
        return this.permissionManager.getUserPermission(messageInstance)
    }

    /**
     *  Fetching guild's configurations.
     *  @param {string} [id=``] Target guild id.
     *  @return {map|null}
     */
    fetchGuildConfigs(id = ``) {
        return this.guilds.cache.get(id).configs
    }
}

module.exports = new Annie([Discord.GatewayIntentBits.Guilds,
Discord.GatewayIntentBits.GuildMessages,
Discord.GatewayIntentBits.GuildMembers,
Discord.GatewayIntentBits.GuildMessageReactions,
Discord.GatewayIntentBits.MessageContent])