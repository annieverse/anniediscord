const Command = require(`../../libs/commands`)
/**
 * Update existing guild bio to a custom bio of your choice.
 * @author Pan
 */
class setGuildBio extends Command {

    /**
     * @param {external:CommandComponents} Stacks refer to Commands Controller.
     */
    constructor(Stacks) {
        super(Stacks)
        this.db = Stacks.bot.db
    }

    /**
     * Running command workflow
     * @param {PistachioMethods} Object pull any pistachio's methods in here.
     */
    async execute({ reply, bot:{db} }) {
        let guild = await this.db.getExistingGuildBio(this.message.guild.id)
        let newBio = this.fullArgs

        //  Handle if guild hasn't registered yet
        if (!guild) return reply(this.locale.SETGUILDBIO.GUILD_UNREGISTERED, {socket: {prefix: this.bot.prefix}})
        //  Handle if user doesn't input any parameter
        if (!this.fullArgs) return reply(this.locale.SETGUILDBIO.MISSING_ARG, {socket: {prefix: this.bot.prefix}})
        //  Handle new bio with over 300 characters
        if (newBio.length > 300) return reply(this.locale.SETGUILDBIO.EXCEEDING_LIMIT, {color: `red`})

        reply(this.locale.SETGUILDBIO.CONFIRMATION, {color: `golden`, socket: {newBio: newBio}})
        this.setSequence(1, 300000)
		this.sequence.on(`collect`, async msg => {
			const input = msg.content.toLowerCase()
			/**
			 * ---------------------
			 * Sequence Cancellations.
			 * ---------------------
			 */
			if (this.cancelParameters.includes(input)) {
				this.endSequence()
				return reply(this.locale.ACTION_CANCELLED)
			}

			/**
             * ---------------------
             * 1.) Confirm
             * ---------------------
             */
            if (this.onSequence == 1) {
                if (!input.startsWith(`y`)) {
                    this.endSequence()
                    return reply(this.locale.ACTION_CANCELLED)
                }
                this.endSequence()
                db.setGuildBio(this.message.guild.id, newBio)
                return reply(this.locale.SETGUILDBIO.SUCCESSFUL, {color: `lightgreen`})
            }
        })
    }
}

module.exports.help = {
    start: setGuildBio,
    name: `setGuildBio`,
    aliases: [`setguildbio`],
    description: `Update existing guild bio to a custom bio of your choice.`,
    usage: `setguildbio <bio>`,
    group: `Setting`,
    permissionLevel: 3,
    multiUser: false
}

