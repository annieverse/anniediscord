const Command = require(`../../libs/commands`)
const superagent = require(`superagent`)
/**
 * Displays a random gif of a hug.
 * @author klerikdust
 */
class Hug extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
    }

    /**
     * Running command workflow
     * @return {void}
     */
    async execute() {
        await this.requestUserMetadata(2)
        await this.requestAuthorMetadata(2)
        const { body } = await superagent.get(`https://purrbot.site/api/img/sfw/hug/gif`)
        //  Lonely hug
        if (!this.user || !this.fullArgs) return this.reply(this.locale.HUG.THEMSELVES, {
            socket: {user: this.author.master.username},
            imageGif: body.link,
        })
        //  Hugging other user
        return this.reply(this.locale.HUG.OTHER_USER, {
            socket: {user: this.author.master.username, targetUser: this.user.master.username},
            imageGif: body.link
        })
    }
}

module.exports.help = {
    start: Hug,
    name: `hug`,
    aliases: [`hugs`, `hug`],
    description: `Displays a random gif of a hug.`,
    usage: `hug <User>(Optional)`,
    group: `Fun`,
    permissionLevel: 0,
    multiUser: true
}
