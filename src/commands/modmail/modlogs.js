const Command = require(`../../libs/commands`)
const moment = require(`moment`)
const modmailConfig = require(`./modmailConfig.json`)
/**
 * Retrieves log ids for specified user
 * @author The Frying Pan
 */
class Logs extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply, chunk, specialArg}) {
        /**
         *  -----------------------
         *  Define workflow in here
         *  -----------------------
         */
        await this.requestUserMetadata(1)

        const requestedUserIsMessageAuthor = this.user.id == this.message.author.id
        const requestedUserIsNotMessageAuthor = this.user.id != this.message.author.id
        const requestMadeInModmailCategory = this.message.channel.parentID == modmailConfig.category

        if (requestedUserIsMessageAuthor || requestedUserIsNotMessageAuthor){
            this.showLog({reply, chunk, specialArg})
        } else if (requestMadeInModmailCategory){
            // get open thread
            this.alreadyOpenThread({reply})
            this.showLog({reply, chunk, specialArg})
        } else {
            reply(`You must be in a open thread or supply a user's name, tag, or id.`)
        }

    }
    
    /**
     * Finds all logs for specified user then displays the log ids on pages.
     * @param {reply} reply
     * @param {chunk} chunk
     * @param {specialArg} specialArg
     */
    async showLog({reply, chunk, specialArg}){
        let userlogs = await this.bot.db.getlogsForUser(this.user.id)

        if (userlogs.length < 1) return reply(`This user has no old logs on record`)

        // Descending by date
        userlogs.sort((a, b) => {
            if (a.registered_at > b.registered_at) return -1
            if (a.registered_at < b.registered_at) return 1
            return 0
        })

        const LOG_LINES_PER_PAGE = 10

        // Pagination
        const totalUserThreads = userlogs.length
        const maxPage = Math.ceil(totalUserThreads / LOG_LINES_PER_PAGE)
        const inputPage = specialArg
        const page = Math.max(Math.min(inputPage ? parseInt(inputPage, 10) : 1, maxPage), 1) // Clamp page to 1-<max page>
        const isPaginated = totalUserThreads > LOG_LINES_PER_PAGE
        const start = (page - 1) * LOG_LINES_PER_PAGE
        const end = page * LOG_LINES_PER_PAGE
        userlogs = userlogs.slice((page - 1) * LOG_LINES_PER_PAGE, page * LOG_LINES_PER_PAGE)

        const threadLines = await Promise.all(userlogs.map(async thread => {
            const logUrl = thread.thread_id
            const formattedDate = moment.utc(thread.registered_at).format(`MMM Do [at] HH:mm [UTC]`)
            return `\`${formattedDate}\`: ${logUrl}`
        }))

        let message = isPaginated
        ? `**Log files for <@${this.user.id}>** (page **${page}/${maxPage}**, showing logs **${start + 1}-${end}/${totalUserThreads}**):`
        : `**Log files for <@${this.user.id}>:**`

        message += `\n${threadLines.join(`\n`)}`

        if (isPaginated) {
            message += `\nTo view more, add a page number to the end of the command like this: ${this.prefix}modlogs3`
        }

        // Send the list of logs in chunks of 15 lines per message
        const lines = message.split(`\n`)
        const chunks = chunk(lines, 15)

        let root = Promise.resolve()
        chunks.forEach(lines => {
            root = root.then(() => reply(lines.join(`\n`)))
        })
    }

    /**
     * Looks for a open thread, and if a open one isn't found trigger the function to make a new thread and open it.
     * @returns {object} user_id
     */
    async alreadyOpenThread({reply}){
        let search = await this.bot.db.alreadyOpenThread(this.message.channel.id)
        if (search == `none` ){
            return reply(`Try suppling a user's tag, name, or id`)
        } else {
            this.user.id = search.user_id
        }
    }
}


module.exports.help = {
    start: Logs,
    name: `modlogs`,
    aliases: [],
    description: `show a list of logs ids for a user`,
    usage: `modlogs @user or in thread logs`,
    group: `modmail`,
    permissionLevel: 2,
    public: true,
    multiUser: false
}