const Command = require(`../../libs/commands`)
const modmailConfig = require(`./modmailConfig.json`)
/**
 * Blocks a user from using modmail
 * @author The Frying Pan
 */
class Block extends Command {

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
    async execute({reply}) {
        /**
         *  -----------------------
         *  Define workflow in here
         *  -----------------------
         */
        await this.requestUserMetadata(1)
        
        const requestedUserIsNotMessageAuthor = this.user.id != this.message.author.id
        const requestedUserIsMessageAuthor = this.user.id = this.message.author.id
        const requestMadeInModmailCategory = this.message.channel.parentID == modmailConfig.category

        if (requestedUserIsNotMessageAuthor) {
            this.bot.db.blockUser(this.user.id)
            reply(`<@!${this.user.id}> has been blocked`)
        } else if (requestedUserIsMessageAuthor){
            return reply(`Sorry but you cant block yourself`)
        } else if (requestMadeInModmailCategory){
            await this.alreadyOpenThread()
            this.bot.db.blockUser(this.userfound)
            reply(`<@!${this.userfound}> has been blocked`)
        } 

    }

    /**
     * Looks for a open thread and set the global user to the open thread's user
     * @param {reply} reply 
     */
    async alreadyOpenThread(){
        // search for the open thread to grab the current user's id
        let search = await this.bot.db.alreadyOpenThread(this.message.channel.id)
        
        // setup ifs 
        const emptySearchResults = search == `none`

        // search for the open thread to grab the current user's id
        if (emptySearchResults){
            return
        } else {
            this.userfound = search.user_id
        }
    }
}


module.exports.help = {
    start: Block,
    name: `block`,
    aliases: [],
    description: `blocks a user from sending messages to annie`,
    usage: `block @user`,
    group: `modmail`,
    permissionLevel: 2,
    public: true,
    multiUser: true
}