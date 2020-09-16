const Command = require(`../../libs/commands`)
const humanizeDuration = require(`humanize-duration`)
const moment = require(`moment`)

/**
 * Makes a new thread if one doesnt exist, and if one does exist, it continues.
 * @author The Frying Pan
 */
class newThread extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.threadId = `123abc`
        this.guildId = this.bot.modmail_guildId
        this.modmailCategory = this.bot.modmail_category
        this.thread = null
        this.time = Date.now()
        this.runCommand = true
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply}) {
        /**
         * Check for open threads, if none open make one
         */

        const isDm = this.message.channel.type == `dm`

        // Set up if tests        
        const blockedUsers = await this.bot.db.getBlockedUsers()
        const isUserBlocked = blockedUsers.includes(this.message.author.id)
        const requestFromModMailCategory = this.message.channel.parentID == this.modmailCategory

        // do some additional checks then grab an open thread if it exists
        if (isDm){ 
            // Check to see if user is blocked from sending messages
            if (isUserBlocked) {
                let blockReason = await this.bot.db.getBlockedUserReason(this.message.author.id)
                return reply(`You have been blocked from using modmail. Because of the following reason:\n${blockReason}`)
            }
            await this.alreadyOpenThread(reply, true)        
        } else if (requestFromModMailCategory){
            await this.alreadyOpenThread(reply, false)
        }

        if (!this.runCommand) return
        // Add attachments to end of message if they exist
        this.attachAttacments

        // Record messages to db then send to corresponding channel
        if (isDm){
            this.bot.db.writeToThread(this.message.author.id, `USER`, this.guildId, this.threadId, this.message.content)
            if (this.thread) return this.relayMessageFromDM(...arguments)
        } else if (requestFromModMailCategory){
            this.bot.db.writeToThread(`MOD`, this.message.author.id, this.guildId, this.threadId, this.message.content)
            if (this.thread) return this.relayMessageFromChannel()
        }

    }

    /**
     * Takes the message from a DM and sends it to the channel on the server through the bot
     * @returns nothing
     */
    relayMessageFromDM(){
        let username = this.thread.is_anonymous == 0 ? `${this.message.author.username}#${this.message.author.discriminator}` : `anonymous`
        try{
            this.bot.guilds.cache.get(this.guildId).channels.cache.get(this.thread.channel).send(`[${moment.utc(this.time).format(`HH:mm`)}] « **${username}:** ${this.message}`)
        }catch(err){
            err.name == `TypeError` && err.message == `Cannot read property 'send' of undefined` ? this.updateLostThread(...arguments) : null
        }
    }

    /**
     * Close old thread and start a new one 
     */
    async updateLostThread(){
        this.bot.db.closeThread(this.thread.thread_id)
        this.logEvent(this.thread)
        this.bot.guilds.cache.get(this.thread.guild_id).members.cache.get(this.thread.user_id).send(`The channel for this thread was deleted, So i have opened a new thread for you.`)
        this.execute(...arguments)
    }

    /**
     * Send a message to the log channel indicating the thread closed and give the thread id
     */
    logEvent(threadTicket){
        let threadUser = this.bot.guilds.cache.get(threadTicket.guild_id).members.cache.get(threadTicket.user_id) 
        let member = {
            username: threadTicket.is_anonymous == 0 ? `${threadUser.user.username}#${threadUser.user.discriminator}` : `anonymous`,
            accountAge: threadUser.user.createdAt, 
            id: threadTicket.is_anonymous == 0 ? threadUser.id : `anonymous`,
            nickname: threadTicket.is_anonymous == 0 ? threadUser.nickname : `anonymous`,
            joined: threadUser.joinedAt
        }
        this.bot.guilds.cache.get(threadTicket.guild_id).channels.cache.get(this.bot.modmail_logChannel).send(`Modmail thread with ${member.username} (${member.id}) was closed by ${this.message.author.username}\nLog ID: ${threadTicket.thread_id}`)
    }

    /**
     * Takes the message from the channel on a server and sends it to the DM of the user through the bot
     * @returns nothing
     */
    relayMessageFromChannel(){
        let username = `${this.message.author.username}`
        this.bot.guilds.cache.get(this.guildId).channels.cache.get(this.thread.channel).send(`[${moment.utc(this.time).format(`HH:mm`)}] » **(${username}) ༶•  Moderator:** ${this.message}`)
        this.bot.guilds.cache.get(this.guildId).members.cache.get(this.thread.user_id).send( `**༶•  Moderator:** ${this.message}`)
        if (!this.messageHasAttachments){
            this.message.delete()
        }
    }

    /**
     * Looks for a open thread, and if a open one isn't found trigger the function to make a new thread and open it.
     * @param {reply} reply 
     */
    async alreadyOpenThread(reply, dm, anonymous = false){
        // setup search varible 
        let search
        
        // setup ifs 
        const messageFromDm = this.message.channel.type == `dm`

        if (messageFromDm){ 
            search = await this.bot.db.alreadyOpenThread(this.message.author.id, dm)
        } else if (this.message.channel.parentID == this.modmailCategory){
            search = await this.bot.db.alreadyOpenThread(this.message.channel.id, dm)
        }

        // Let search be filled then test
        const emptySearchResults = search == `none`

        if (emptySearchResults){
            if (messageFromDm){
                return await this.makeNewThread(reply, anonymous)
            }
        } else if (search.channel){
            this.threadId = search.thread_id
            this.thread = search
        }
    }

    /**
     * get the total number of previous logs
     * @returns {number} length
     */
    async previouslogs(){
        let search
        if (this.thread.is_anonymous == 0) {
            search = await this.bot.db.getlogsForUser(this.message.author.id)
            return search.length 
        } else {
            search = `not available`
            return search
        }
    }

    /**
     * Takes information about the user like age of account, id, nicname on server, and when they joined, then formats and returns a string
     * @param {info} userInfo 
     * @returns string
     */
    async constructHeader(userInfo){
        return this.thread.is_anonymous == 0 ? `ACCOUNT AGE **${this.dateFormat(userInfo.accountAge)}**, ID **${userInfo.id}**\nNICKNAME **${userInfo.nickname}**, JOINED **${this.dateFormat(userInfo.joined)}**\n\nThis user has **${await this.previouslogs()}** previous modmail threads. Use \`${this.prefix}modlogs\` to see them.\n────────────────` :
        `ACCOUNT AGE **${this.dateFormat(userInfo.accountAge)}**, ID **${userInfo.id}**\nNICKNAME **${userInfo.nickname}**, JOINED **${this.dateFormat(userInfo.joined)}**\n────────────────` 
    }

    /**
     * format date objects in the form of duration from one date to another date
     * @param {Date} date 
     * @returns {Date} formated
     */
    dateFormat(date){
        const formateDateObj = (delay, opts = {}) => humanizeDuration(delay, Object.assign({conjunction: ` , `}, opts))
        return formateDateObj(Date.now() - date, {largest: 2, round: true})
    }

    /**
     * Make a new open thread with a unique random ID
     * @param {reply} reply 
     * @param {Boolean} anon
     * @returns {null} nothing
     */
    async makeNewThread(reply, anon = 0){
        this.runCommand = false
        // translate boolean (true/false) to boolean (0/1)
        anon ? anon = 1 : anon = 0
        
        // Initial thread making
        this.threadId = this.makeRandomId
        this.bot.db.makeNewThread(this.message.author.id, this.guildId, this.threadId, `open`, anon)
        
        // Update global thread incase thread_id changed
        this.thread = await this.bot.db.alreadyOpenThread(this.message.author.id)

        // Setup channel properties
        let channelName = this.thread.is_anonymous == 0 ? `${this.message.author.username.substring(0,9)}-${this.message.author.discriminator}` : `anonymous`

        // Setup user info
        // Setup user info
        let userInfo = {
            username: this.thread.is_anonymous == 0 ? `${this.message.author.username}#${this.message.author.discriminator}` : `anonymous`,
            accountAge: this.message.author.createdAt, 
            id: this.thread.is_anonymous == 0 ? this.message.author.id :`anonymous`,
            nickname: this.thread.is_anonymous == 0 ? this.bot.guilds.cache.get(this.guildId).members.cache.get(this.message.author.id).nickname: `anonymous`,
            joined: this.bot.guilds.cache.get(this.guildId).members.cache.get(this.message.author.id).joinedAt
        }
        // Make Private Channel on server
        this.bot.guilds.cache.get(this.guildId).channels.create(channelName,{parent: this.modmailCategory}).then(async channel => {
            
            // Record the channel's id to thread's database information
            await this.bot.db.updateChannel(channel.id, this.threadId)

            // Get header
            let header = await this.constructHeader(userInfo)

            // Notify Mods
            let mentionrole = /*modmailConfig.mentionRole ? `<@&${modmailConfig.mentionRole}` : `@here` Add in later patch*/ `@The Frying Pan#8677 `
            channel.send(`${mentionrole} New modmail thread (${userInfo.username})`)

            // Header
            channel.send(`${header}`)

            this.attachAttacments

            //Post First Message
            channel.send(`[${moment.utc(this.time).format(`HH:mm`)}] « **${userInfo.username}:** ${this.message}`)
            
            let repsonseMessage = `Thank you for your message! Our mod team will reply to you here as soon as possible.` /*modmailConfig.repsonseMessage ? modmailConfig.repsonseMessage : `Thank you for your message! Our mod team will reply to you here as soon as possible.`Add in later patch*/
            return reply(repsonseMessage)
        })
    }

    get attachAttacments(){
        const isDm = this.message.channel.type == `dm`
        const hasAttachments = this.messageHasAttachments
        const requestFromModMailCategory = this.message.channel.parentID == this.modmailCategory
        if (hasAttachments){
            if (isDm){
                this.message.attachments.array().forEach(e => this.bot.guilds.cache.get(this.guildId).channels.get(this.thread.channel).send({
                    files: [e.url]
                }))
                return this.message.attachments.array().forEach(e => this.bot.guilds.cache.get(this.guildId).channels.get(this.bot.modmail_logChannel).send({
                    files: [e.url]
                }).then(m => this.bot.db.writeToThread(this.message.author.id, `USER`, this.guildId, this.threadId, m.url)))
            } else if (requestFromModMailCategory){
                this.message.attachments.array().forEach(e => this.bot.guilds.cache.get(this.guildId).channels.get(this.thread.channel).send({
                    files: [e.url]
                }))
                return this.message.attachments.array().forEach(e => this.bot.guilds.cache.get(this.guildId).channels.get(this.bot.modmail_logChannel).send({
                    files: [e.url]
                }).then(m => this.bot.db.writeToThread(`MOD`, this.message.author.id, this.guildId, this.threadId, m.url)))
            }
        }
        return null
    }

    /**
     * Checks if the message object has any attachments
     * @returns {Boolean} true/false
     */
    get messageHasAttachments(){
        return this.message.attachments.size > 0 ? true : false
    }

    /**
     * Makes a unique id for a thread with a length of 20
     * @returns {string} id
     */
    get makeRandomId(){
        var result = ``
        var characters = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789`
        var charactersLength = characters.length
        for ( var i = 0; i < 20; i++ ) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength))
        }
        return result
    }
}


module.exports.help = {
    start: newThread,
    name: `newThread`,
    aliases: [`newthread`],
    description: `test`,
    usage: `newThread`,
    group: `modmail`,
    permissionLevel: 0,
    public: true,
    multiUser: false
}