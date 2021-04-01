const ms = require(`ms`)
const CronManager = require(`cron-job-manager`)
const { v4: uuidv4 } = require(`uuid`)
const { MessageEmbed } = require(`discord.js`)
/**
 * Manages Annie's reminder API
 * @abstract
 */
class Reminder {
    constructor(client={}) {
        this.client = client
        this.pool = new CronManager()
        this.initialize()
    }
    
    /**
     * Initializing reminders and populating them into cron manager
     * @return {class}
     */
    async initialize() {
        const fn = `[Reminder._initialize]`
        //  Handle if there are no registered reminders in the database
        const savedReminders = await this.db.getAllReminders()
        if (savedReminders.length <= 0) return this.logger.info(`${fn} there are no saved reminders.`)
        //  List of registered contexts from all the available shards.
        const registeredContexts = await this.client.shard.broadcastEval(`Object.keys(this.reminders.pool.jobs)`)
        //  Iterate over the reminders and register them to cron
        let activeReminders = 0
        for (let i=0; i<savedReminders.length; i++) {
            const context = savedReminders[i]
            let normalizedContext = {
                registeredAt: context.registered_at,
                id: context.reminder_id,
                userId: context.user_id,
                message: context.message,
                remindAt: JSON.parse(context.remind_at)
            }
            normalizedContext.remindAt.timestamp = new Date(normalizedContext.remindAt.timestamp)
            if (normalizedContext.remindAt.timestamp <= new Date()) continue
            //  Make sure the context only registered once among all shards.
            if (registeredContexts.includes(context.reminder_id)) continue
            this.startReminder(normalizedContext)
            activeReminders++
        }
        this.logger.info(`${fn} ${activeReminders} reminders have been added into cron`)
    }

    /**
     * Registering new reminder
     * @param {string} userId the reminder's owner
     * @param {object} context the context of reminder
     * @return {boolean}
     */
    async register(context={}) {
        const cacheId = `REMINDERS@${context.userId}`
        //  Registering into cron
        this.logger.info(`[Reminder.register] registering a new reminder for USER_ID:${context.userId} with UUID:${context.id}`)
        this.startReminder(context)
        //  Registering into cache
        let cachedReminders = []
        const existingCacheReminders = await this.cache.get(cacheId)
        if (existingCacheReminders) cachedReminders = existingCacheReminders
        cachedReminders.push({
            registered_at: context.registeredAt,
            reminder_id: context.id,
            user_id: context.userId,
            message: context.message,
            remind_at: context.remindAt
        })
        this.cache.set(context.id, cachedReminders.toString())
        //  Registering into database
        this.db.registerUserReminder(context)
        return true
    }

    /**
     * Starting the reminder cron
     * @param {object} context the context of reminder
     * @return {void}
     */
    startReminder(context) {
        this.pool.add(context.id, context.remindAt.timestamp, async () => {
            const fn = `[Reminder.send][${context.id}]`
            const cacheId = `REMINDERS@${context.userId}`
            //  Find the target user
            const targetUser = await this.client.users.fetch(context.userId)
            //  Handle if user cannot be found
            if (!targetUser) this.logger.warn(`${fn} user was unreachable. `)
            try {
                const embed = new MessageEmbed()
                    .setColor(`#ffc9e2`)
                    .setDescription(`**Here is your reminder!♡**\n╰─` + context.message)
                targetUser.send(embed)
            }
            //  Handle if user's DM is locked
            catch (e) {
                this.logger.warn(`${fn} user's direct message was locked.`)
            }
            finally {
                //  Terminate cron
                this.pool.stop(context.id)
                this.pool.deleteJob(context.id)
                //  Delete from cache
                const cachedReminders = await this.cache.get(cacheId)
                if (cachedReminders) {
                    const refreshedRemindersCache = cachedReminders.filter(node => node.reminder_id !== context.id)
                    this.cache.set(cacheId, refreshedRemindersCache)
                    this.logger.debug(`refreshed cache for ${cacheId}`)
                }
                else {
                    this.cache.del(context.id)
                    this.logger.debug(`deleted cache for ${cacheId}`)
                }
                //  Delete from database
                await this.db.deleteUserReminder(context.id)
                this.logger.debug(`deleted ${context.id} from database`)
                this.logger.info(`[Reminder.finish][${context.id}] reminder has completed and omitted.`)
            }
        }, {start: true})
    }

    /**
     * Fetch registered reminders for given user id
     * @param {string} userId
     * @return {array|null}
     */
    async getReminders(userId=``) {
        const fn = `[Reminder.getReminders]`
        const id = `REMINDERS@${userId}`
        let source = null
        //  Find in the cache if available
        const cachedReminders = await this.cache.get(id)
        if (cachedReminders) {
            this.logger.debug(`${fn} found USER:${id} on cache.`)
            source = cachedReminders
        }
        //  Otherwise, try find in database
        else {
            const remindersInDatabase = await this.db.getUserReminders(userId)
            if (remindersInDatabase.length > 0) {
                this.logger.debug(`${fn} found ${id} on database.`)
                source = remindersInDatabase
            }
        }
        //  Handle if there are no saved reminders
        if (source === null) {
            this.logger.debug(`${fn} can't find any registered reminders for ${id}`)
            return []
        }
        return source
    }
    
    /**
     * Parsing reminder's context from user message
     * @param {string} query
     * @param {string} userId
     * @return {object}
     */
    getContextFrom(query=``, userId=``) {
        let context = this.baseReminderContext
        context.id = uuidv4()
        context.userId = userId
        //  Handle if query is too short
        if (query.length <= 1) return context
        //  Handle if there is only single token
        let tokens = query.split(` `)
        if (tokens.length <= 1) return context
        //  Find date by combining tokens
        for (let i=0; i<tokens.length; i++) {
            const token = tokens[i]
            for (let s=0; s<(tokens.length-1); s++) {
                const nextToken = tokens[s+1]
                const composedToken = `${token} ${nextToken}`
                const composedResult = ms(composedToken)
                //  Assign if found valid date
                if (composedResult !== undefined) {
                    tokens.splice(i, 2)
                    context.isValidReminder = true
                    context.remindAt = this.getDate(composedResult)
                    break
                }
            }
            //  Check if remind date already found with composed token above
            if (context.isValidReminder) break
            //  Check by single token
            const result = ms(token)
            if (result !== undefined) {
                tokens.splice(i, 1)
                context.isValidReminder = true
                context.remindAt = this.getDate(result)
                break
            }
        }
        //  Handle if no reminder date has been found during previous iterations
        if (!context.isValidReminder) return context
        //  Ommit date prefix if there's any in the last index
        if (tokens[tokens.length-1]) {
			if (tokens[tokens.length-1].includes(`in`)) tokens.pop()
		}
		//  Use default message if custom message is not provided
        context.message = tokens.length > 0 ? tokens.join(` `) : `Custom message wasn't provided.` 
        return context
    }

    /**
     * Adds milliseconds into current date and return cron form of it
     * as well with the timestamp data.
     * @param {number} ms
     * @return {object}
     */
    getDate(ms=0) {
        const currentDate = new Date()
        return {
            timestamp: new Date(currentDate.getTime() + ms),
            milliseconds: ms
        }
    }

    /**
     * Default object structure for reminder's context
     * @type {object}
     */
    get baseReminderContext() {
        return {
            registeredAt: new Date(),
            id: null,
            userId: null,
            message: ``,
            remindAt: null,
            isValidReminder: false
        }
    }

    /**
     * Cache Factory
     * @type {redis}
     */
    get cache() {
        return this.client.db.redis
    }

    /**
     * Logger Library
     * @type {winston} 
     */
    get logger() {
        return this.client.logger
    }

    /**
     * Database Library
     * @type {Database}
     */
    get db() {
        return this.client.db
    }
}

module.exports = Reminder
