const Command = require(`../../libs/commands`)
const modmailConfig = require(`./modmailConfig.json`)
/**
 * Command's Class description
 * @author yourname
 */
class DeleteLogs extends Command {

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
    async execute({reply}) {
                
        let threadTicket = await this.bot.db.getThreadTicket(this.args[0])

        if (!threadTicket) return reply(`There is no log with this id: **${this.args[0]}**`)

        await this.bot.db.deleteLog(this.args[0])
        return reply(`Log ${this.args[0]} has been deleted and is irreversible.`)
    
    }
}


module.exports.help = {
    start: DeleteLogs,
    name: `delete`,
    aliases: [],
    description: `delete a conversation by locating the thread's id`,
    usage: `delete @logId`,
    group: `modmail`,
    permissionLevel: 2,
    public: true,
    multiUser: false
}