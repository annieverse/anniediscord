const Command = require(`../../libs/commands`)
const moment = require(`moment`)
const humanizeDuration = require(`humanize-duration`)
const modmailConfig = require(`./modmailConfig.json`)
/**
 * show conversation for a specified thread
 * @author The Frying Pan
 */
class ShowLogs extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.guildId = modmailConfig.guildId
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply, chunk}) {
        /**
         *  -----------------------
         *  Define workflow in here
         *  -----------------------
         */
        let threadTicket = await this.bot.db.getThreadTicket(this.args[0])
        if (!threadTicket) return reply(`There is no log with this id: **${this.args[0]}**`)
        let userThreads = await this.bot.db.getLogByThreadId(this.args[0])

        
        const guild = this.bot.guilds.get(this.guildId)
        const guildMember = guild.members
        let threadUser = this.bot.guilds.get(this.guildId).members.cache.get(threadTicket.user_id) 

        // Descending by date
        userThreads.sort((a, b) => {
            if (a.registered_at > b.registered_at) return -1
            if (a.registered_at < b.registered_at) return 1
            return 0
        })

        let userInfo = {
            username: threadTicket.is_anonymous == 0 ? `${threadUser.user.username}#${threadUser.user.discriminator}` : `anonymous`,
            accountAge: threadUser.user.createdAt, 
            id: threadTicket.is_anonymous == 0 ? threadUser.id : `anonymous`,
            nickname: threadTicket.is_anonymous == 0 ? threadUser.nickname : `anonymous`,
            joined: threadUser.joinedAt
        }

        let result = ``
        result += `old modmail thread (${userInfo.username})\n`
        result += `ACCOUNT AGE **${this.dateFormat(userInfo.accountAge)}**, ID **${userInfo.id}**\nNICKNAME **${userInfo.nickname}**, JOINED **${this.dateFormat(userInfo.joined)}**\n\nThis user has **${await this.previouslogs()}** previous modmail threads. Use \`${this.prefix}logs\` to see them.\n***Note:** If a link doesn't display an image it means the image has been deleted... for future download image to local computer during the thread while it's open.*────────────────\n`
        for (let index = 0; index < userThreads.length; index++) {
            const element = userThreads[index]
            if (element.user_id == `MOD`){
                result += `[${moment.utc(element.registered_at).format(`HH:mm`)}] » **(${guildMember.get(element.mod_id).user.username}) ༶•  Moderator:** ${element.message}\n`
            } else if (element.mod_id == `USER`){
                result += element.is_anonymous == 0 ? `[${moment.utc(element.registered_at).format(`HH:mm`)}] « **${guildMember.get(element.user_id).user.username}:** ${element.message}\n` : 
                `[${moment.utc(element.registered_at).format(`HH:mm`)}] « **(anonymous):** ${element.message}\n`
            } else {
                result += `[${moment.utc(element.registered_at).format(`HH:mm`)}] » **(BOT):** ${element.message}\n`
            }
        }

        let message = result
        const lines = message.split(`\n`)
        const chunks = chunk(lines, 15)

        let root = Promise.resolve()
        chunks.forEach(lines => {
            root = root.then(() => this.message.channel.send(lines.join(`\n`)))
        })
    
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
     * get the total number of previous logs
     * @returns {number} amount of logs
     */
    async previouslogs(){
        let search = await this.bot.db.getlogsForUser(this.message.author.id)
        return search.length
    }
}


module.exports.help = {
    start: ShowLogs,
    name: `showlogs`,
    aliases: [],
    description: `show a conversation by locating the thread's id`,
    usage: `showlogs @logId`,
    group: `modmail`,
    permissionLevel: 2,
    public: true,
    multiUser: false
}