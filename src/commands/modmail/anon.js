const Command = require(`../../libs/commands`)
const humanizeDuration = require(`humanize-duration`)
const moment = require(`moment`)
const modmailConfig = require(`./modmailConfig.json`)

/**
 * Makes a anonymous thread
 * @author The Frying Pan
 */
class Anon extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.threadId = `123abc`
        this.guildId = modmailConfig.guildId
        this.modmailCategory = modmailConfig.category
        this.thread = null
        this.time = Date.now()
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply}) {

        const isDm = this.message.channel.type == `dm`

        // Make sure message is coming from a dm
        if (!isDm) return

        // Set up if tests        
        const blockedUsers = await this.bot.db.getBlockedUsers()
        const isUserBlocked = blockedUsers.includes(this.message.author.id)
        const hasAttachments = this.messageHasAttachments

        // Check to see if user is blocked from sending messages
        if (isUserBlocked) {
            let blockReason = await this.bot.db.getBlockedUserReason(this.message.author.id)
            return reply(`You have been blocked from using modmail. Because of the following reason:\n${blockReason}`)
        }

        // Clean the message content by getting rid of command name
        this.message.content = this.message.content.slice(6)
        
        // Grab the open thread or make a new thread if one doesn't exist
        await this.alreadyOpenThread(reply, true, true)        

        // Check if the message contains any attachments
        if (hasAttachments){
            // Add any attachment urls, to the end of the message
            this.message.attachments.array().forEach(e => this.message.content += `\n${e.url}\n`)
            reply(`There was an image attached so I used discord's url to the image to relay it. For the best transfer of images please use a link.`)
        }
        
        // record the message to the database
        this.bot.db.writeToThread(this.message.author.id, `USER`, this.guildId, this.threadId, this.message.content)

        // send message to channel from dm
        this.relayMessageFromDM()

    }

    /**
     * Takes the message from a DM and sends it to the channel on the server through the bot
     * @returns nothing
     */
    relayMessageFromDM(){
        // build the display username then send message to channel
        let username = `anonymous`
        this.bot.guilds.get(this.guildId).channels.get(this.thread.channel).send(`[${moment.utc(this.time).format(`HH:mm`)}] « **${username}:** ${this.message}`)
    }

    /**
     * Looks for a open thread, and if a open one isn't found trigger the function to make a new thread and open it.
     * @param {reply} reply 
     * @param {boolean} dm
     * @param {boolean} anonymous
     * 
     */
    async alreadyOpenThread(reply, dm, anonymous = true){
        
        // setup search varible 
        let search

        // setup ifs 
        const messageFromDm = this.message.channel.type == `dm`
        // see if the user has an open thread already
        if (messageFromDm) search = await this.bot.db.alreadyOpenThread(this.message.author.id, dm)

        // Fill search var then test it
        const emptySearchResults = search == `none`

        // test the results
        if (emptySearchResults){
            // make a new thread
            if (messageFromDm){
                return await this.makeNewThread(reply, anonymous)
            }
        } else {
            // fill in global varibles with the found open thread
            this.threadId = search.thread_id
            this.thread = search
        }
    }

    /**
     * Takes information about the user like age of account, id, nicname on server, and when they joined, then formats and returns a string
     * @param {object} userInfo 
     * @returns string
     */
    async constructHeader(userInfo){
        // Construct first message header
        return `ACCOUNT AGE **${this.dateFormat(userInfo.accountAge)}**, ID **${userInfo.id}**\nNICKNAME **${userInfo.nickname}**, JOINED **${this.dateFormat(userInfo.joined)}**\n────────────────` 
    }

    /**
     * format date objects in the form of duration from one date to another date
     * @param {Date} date 
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
        let userInfo = {
            username: this.thread.is_anonymous == 0 ? `${this.message.author.username}#${this.message.author.discriminator}` : `anonymous`,
            accountAge: this.message.author.createdAt, 
            id: this.thread.is_anonymous == 0 ? this.message.author.id :`anonymous`,
            nickname: this.thread.is_anonymous == 0 ? this.bot.guilds.get(this.guildId).members.get(this.message.author.id).nickname: `anonymous`,
            joined: this.bot.guilds.get(this.guildId).members.get(this.message.author.id).joinedAt
        }

        // Make Private Channel on server
        this.bot.guilds.get(this.guildId).createChannel(channelName).then(async channel => {
            // Set channel to modmail category
            await channel.setParent(this.modmailCategory)
            // Sync channel to modmail category permissions
            await channel.lockPermissions()
            // Record the channel's id to thread's database information
            await this.bot.db.updateChannel(channel.id, this.threadId)

            // Get header
            let header = await this.constructHeader(userInfo)

            // Notify Mods
            let mentionrole = modmailConfig.mentionRole ? `<@&${modmailConfig.mentionRole}` : `@here`
            channel.send(`${mentionrole} New modmail thread (${userInfo.username})`)

            // Header
            channel.send(`${header}`)

            const hasAttachments = this.messageHasAttachments

            if (hasAttachments){
                this.message.attachments.array().forEach(e => this.message.content += `\n${e.url}\n`)
                reply(`There was an image attached so I used discord's url to the image to relay it. For the best transfer of images please use a link.`)
            }

            //Post First Message
            channel.send(`[${moment.utc(this.time).format(`HH:mm`)}] « **${userInfo.username}:** ${this.message}`)
            
            let repsonseMessage = modmailConfig.repsonseMessage ? modmailConfig.repsonseMessage : `Thank you for your message! Our mod team will reply to you here as soon as possible.`
            reply(repsonseMessage)
        })
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
    start: Anon,
    name: `anon`,
    aliases: [],
    description: `Makes a thread anonymous, but only can be used at the start`,
    usage: `anon <message>`,
    group: `modmail`,
    permissionLevel: 0,
    public: true,
    multiUser: true
}