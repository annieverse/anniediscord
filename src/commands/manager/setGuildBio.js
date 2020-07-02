const Command = require(`../../libs/commands`)
/**
 * Update existiing bio to a custom bio for your server
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
        let oldBio = await this.db.getExistingGuildBio(this.message.guild.id)
        !oldBio.bio ? oldBio = `no bio previously` : oldBio = oldBio.bio
        let newBio = this.fullArgs
        if (newBio.length > 300) return reply(`I'm sorry but that bio is too long please keep it under 300 characters`)
        reply(`Are you sure you want to change your guild bio from "{{oldBio}}" \nTo: "{{newBio}}"\n Please respond with yes or no`,{
            socket:{"oldBio": oldBio, "newBio": newBio}
        })

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
                if ([`y`,`yes`].includes(input)){
                    this.endSequence()
                    db.setGuildBio(this.message.guild.id, newBio)
                    return reply(`Okay your guild bio has been updated.`)
                } else {
                    this.endSequence()
                    return reply(this.locale.ACTION_CANCELLED)
                }
            }


        })
    }

    async existingBio(){
        return await this.db.getExistingGuildBio(this.message.guild.id)
    }
}

module.exports.help = {
    start: setGuildBio,
    name: `setGuildBio`,
    aliases: [`setguildbio`],
    description: `Update existiing bio to a custom bio for your server.`,
    usage: `setBio <bio>`,
    group: `Manager`,
    permissionLevel: 3,
    multiUser: false
}

