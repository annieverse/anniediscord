const Command = require(`../../libs/commands`)
/**
 * AI-Generated Anime Face provided by Gwern@TWDNE
 * @author klerikdust
 */
class FaceGenerate extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
	constructor(Stacks) {
        super(Stacks)
        /**
         * Maximum ID range
         * @type {number}
         */
        this.range = 100000
        /**
         * Source used to fetch the image
         * @type {string}
         */
        this.source = `https://www.thiswaifudoesnotexist.net/`
    }
    
    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
	async execute({ reply, emoji }) {
        const getID = Math.floor(Math.random() * this.range)
        this.fetching = await reply(this.locale.FACEGEN.FETCHING, {simplified: true, socket: {emoji: emoji(`AAUloading`)} })
        await reply(this.locale.FACEGEN.HEADER, {
            customHeader: [this.message.author.username, this.message.author.displayAvatarURL()],
            image: this.source + `example-${getID}.jpg`,
            prebuffer: true
        })
        this.logger.info(`[Command.FaceGenerate] displaying image with ID:${getID} `)
        this.fetching.delete()
    }
}
module.exports.help = {
	start: FaceGenerate,
	name: `facegen`,
	aliases: [`facegen`, `anigen`, `waifugen`, `wfgen`, `fcgen`, `waifu`, `generatewaifu`],
	description: `AI-Generated Anime Face provided by Gwern@TWDNE`,
	usage: `facegen`,
    group: `Artsy`,
    permissionLevel: 0,
	multiUser: false
}