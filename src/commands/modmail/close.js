const Command = require(`../../libs/commands`)
const modmailConfig = require(`./modmailConfig.json`)
/**
 * Command's Class description
 * @author The Frying Pan
 */
class closeThread extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.stacks = Stacks
        this.modmailCategory = modmailConfig.category
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({reply}) {
        
        const isDm = this.message.channel.type == `dm`
        const requestMadeInModmailCategory = this.message.channel.parentID == this.modmailCategory

        if (isDm){ 
            await this.alreadyOpenThread(reply, true)        
        } else if (requestMadeInModmailCategory){
            await this.alreadyOpenThread(reply, false)
        }
    }

    /**
     * Looks for a open thread, then triggers the event to close thread if one is found
     * @param {reply} reply 
     * @param {boolean} dm 
     */
    async alreadyOpenThread(reply, dm){
        
        let search 
        // setup ifs 
        const emptySearchResults = search == `none`
        const messageFromDm = this.message.channel.type == `dm`
        const requestMadeInModmailCategory = this.message.channel.parentID == this.modmailCategory

        // if request from dm, use message.author.id, if from modmail category use channel.id
        if (messageFromDm){ 
           search = await this.bot.db.alreadyOpenThread(this.message.author.id, dm)
        } else if (requestMadeInModmailCategory){
            search = await this.bot.db.alreadyOpenThread(this.message.channel.id, dm)
        }
        
        if (emptySearchResults){
            if (messageFromDm){
                return reply(`There is currently no open thread, type a new message to start one :)`)
            }
        } else {
            // Close thread
            this.closeThread(search)
            if (messageFromDm){
                reply(`This thread has been closed.`)
            } else {
                this.bot.guilds.cache.get(search.guild_id).members.cache.get(search.user_id).send(`This thread has been closed.`)
            }
           
        }
    }

    /**
     * Update the database and delete the channel
     * @param {object} thread 
     * @returns nothing
     */
    async closeThread(thread){
        this.bot.db.closeThread(thread.thread_id)
        this.bot.guilds.cache.get(thread.guild_id).channels.get(thread.channel).delete()
        this.logEvent(thread)
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
        this.bot.guilds.cache.get(threadTicket.guild_id).channels.get(modmailConfig.logChannel).send(`Modmail thread with ${member.username} (${member.id}) was closed by ${this.message.author.username}\nLog ID: ${threadTicket.thread_id}`)
    }
}


module.exports.help = {
    start: closeThread,
    name: `close`,
    aliases: [`closethread`],
    description: `test`,
    usage: `close`,
    group: `modmail`,
    permissionLevel: 0,
    public: true,
    multiUser: false
}