const Command = require(`../../libs/commands`)
const moment = require(`moment`)
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
    async execute({ reply, name, commanifier }) {
		let members = this.message.guild.memberCount
		let botSize =  this.message.guild.members.filter(a => a.user.bot).size
		let userSize = members - botSize
		let onmem = this.message.guild.members.filter(a => a.user.presence.status === `online`).size

		return reply(`
			${this.message.guild.region.charAt(0).toUpperCase() + this.message.guild.region.slice(1)}-based Guild

			Owned by **${name(this.message.guild.ownerID)}**

			**• When the guild was found?**
			It's exactly ${moment(this.message.guild.createdAt).fromNow()}.
			and I saw you were joining to this server ${moment(this.message.member.joinedAt).fromNow()}.

			**• How many members do we have?**
			I can smell ${commanifier(userSize)} hoomans are currently living in this guild and the rest ${commanifier(botSize)} creatures are my friend. x)
			But, did you know?
			${onmem} users are currently active in this server! go greet them!

			**• Hmm, what about the channels and roles?**
			Hah! they have ${this.message.guild.channels.size} channels and ${this.message.guild.roles.size} roles!
			Is that what you are looking for?
			Wait, they also have ${this.bot.channels.get(this.message.guild.systemChannelID)} as their main channel.

			Okay, that's all I know! 

		`, {
			header: this.message.guild.name,
			thumbnail: this.message.guild.iconURL
		})
	}
}

module.exports.help = {
	start: ServerInfo,
	name:`serverInfo`,
	aliases: [`guildinfo`, `infoguild`, `serverinfo`, `infoserver`, `aboutserver`],
	description: `Displays info about the server`,
	usage: `serverinfo`,
	group: `Server`,
	permissionLevel: 0,
	multiUser: false
}