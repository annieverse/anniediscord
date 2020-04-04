const Command = require(`../../libs/commands`)
/**
 * Displays info about the server
 * @author klerikdust
 */
class ServerInfo extends Command {

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
		let message = this.message
		let palette = this.stacks.palette
		/// serverinfo.js
		///
		///  server info command
		///    change logs:
		///       10/19/18 - added more data(owner & region)
		///       10/18/18 - embed changes.
		///       09/20/18 - More data, ms-module & rework embed.
		///
		///     -naphnaphz
		///     -Frying Pan


		let sicon = message.guild.iconURL
		let members = message.guild.memberCount
		let botSize = message.guild.members.filter(a => a.user.bot).size
		let userSize = members - botSize
		var timestamp = new Date

		let onmem = message.guild.members.filter(a => a.user.presence.status === `online`).size
		let idlemem = message.guild.members.filter(a => a.user.presence.status === `idle`).size
		let dndmem = message.guild.members.filter(a => a.user.presence.status === `dnd`).size

		let createdAtMs = ms(Date.now() - (message.guild.createdAt))
		let joinedAtMs = ms(Date.now() - (message.member.joinedAt))

		let serverembed = new Discord.RichEmbed()

			.setColor(palette.halloween)
			.setThumbnail(sicon)
			.addField(`Server Name`, message.guild.name, true)
			.addField(`Region`, message.guild.region, true)
			.addField(`Owner`, `<@${message.guild.ownerID}>`)
			.addField(`Created on`, `${createdAtMs.days} days, ${createdAtMs.hours} hours ago.`, true)
			.addField(`Date joined`, `${joinedAtMs.days} days, ${joinedAtMs.hours} hours ago.`, true)
			.addField(`Customs`, `• **${message.guild.channels.size}** Channels\n• **${userSize}** Users\n• **${botSize}** Bots\n• **${members}** Members`, true)
			.addField(`Presence Status`, `• **${onmem}** Online\n• **${idlemem}** Idle\n• **${dndmem}** Away\n• **${members - onmem - dndmem - idlemem}** Offline\n`, true)
			.addBlankField()
			.setFooter(`Anime Artist United | Server Information`, sicon)
			.setTimestamp(timestamp)

		return message.channel.send(serverembed)
	}
}

module.exports.help = {
	start: ServerInfo,
	name:`serverinfo`,
	aliases: [`guildinfo`, `infoguild`, `serverinfo`, `infoserver`, `aboutserver`],
	description: `Displays info about the server`,
	usage: `serverinfo`,
	group: `Server`,
	permissionLevel: 0,
	multiUser: false
}