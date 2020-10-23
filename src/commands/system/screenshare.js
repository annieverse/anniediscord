const Command = require(`../../libs/commands`)
/**
 * Gives a link to screen share in the server
 * @author Bait God
 */
class Screenshare extends Command {

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
    async execute({ reply }) {
		let link_start = `https://discordapp.com/channels/${this.message.guild.id}/`
		let link_end = ``
		if (this.message.member.voiceChannelID == null || undefined) return reply(`I'm sorry, but you must be in a voice channel first.`)
		link_end = this.message.member.voiceChannelID
		return reply(`[Join/Start Screenshare!](${link_start + link_end})`, { notch:true })
	}
}

module.exports.help = {
	start: Screenshare,
	name: `screenshare`,
	aliases: [`tea`],
	description: `Gives a link to screen share in the server`,
	usage: `screenshare`,
	group: `System`,
	permissionLevel: 0,
	multiUser: false,
	invisible: true
}
